---
layout: single
title:  "Mysql慢查询优化——IN查询不走索引"
date:   2020-12-28 10:00:00 +0800
categories: Mysql
toc: true
toc_label: "目录"
toc_icon: "align-left"
---

## 问题背景

最近优化慢查询时，发现由于业务的变更，之前不常用的字段作为了查询条件，慢查询日志中的rows达到了18万行，因为没有索引，所以进行了全表扫描。顾采取策略为改查询字段添加索引。添加索引后，使用explain分析语句，显示会使用索引。
> 业务修改时，业务人员撰写新SQL后，一定要使用explain命令进行评估。

索引上线后，过了一天再查看慢查询日志，发现该慢查询依然在列，依然全局扫描。

> MySQL使用引擎InnoDB

## 问题分析
首先猜测一下可能是什么问题导致的：
1. 索引没有上？ -> 和运维人员确认后排除
2. SQL语句中使用了IN语句，IN语句可能会使用不到索引？ -> 发现了optimizer会先分析选择使用索引还是全表扫描

立马google找到一个相关问题，[MySQL not using indexes with WHERE IN clause?](https://stackoverflow.com/questions/586381/mysql-not-using-indexes-with-where-in-clause)。先简单复述一下高票回答：Mysql中有一个优化器(optimizer)，在选择执行方案时，需要根据分析数据表(analyze table)的结果来选择最优的执行方案。分析数据正确的话，可以取得很好的效果，反之则需要重新分析数据表更正数据。如果在更正后分析数据后的性能你仍然不满意的话，可以使用强制使用索引的方法(force index)。

总而言之，Mysql优化器认为全表扫描比使用索引更快，帮我做了更好的选择，如果你实在想用索引，那就强制使用索引吧！

那么问题来了：全表扫描真的比索引更快嘛？

### 全表扫描真的比索引更快嘛？

MySQL的查询优化器会通过两个API来了解存储引擎的索引值的分布信息，以决定如何使用索引。
- 第一个API是records_in_range()，通过向存储引擎传入两个边界值获取在这个范围大概有多少条记录。对于某些存储引擎，该接口返回精确值，例如MyISAM；但对于另一些存储引擎则是一个**估算值**，例如InnoDB。
- 第二个API是info()，该接口返回各种类型的数据，包括**索引的基数(每个键值有多少条记录)**。
如果存储引擎向优化器提供的扫描行数信息是不准确的数据，或者执行计划本身太复杂以致无法准确地获取各个阶段匹配的行数，那么优化器会使用索引统计信息来估算扫描行数。MySQL优化器使用的是**基于成本的模型**，而衡量成本的主要指标就是**一个查询需要扫描多少行**。如果表没有统计信息，或者统计信息不准确，优化器就很有可能做出错误的决定。可以通过运行ANALYE TABLE来重新生成统计信息解决这个问题。

#### 索引的基数(Cardinality)
直到MySQL 5.5版本，InnoDB也不在磁盘存储索引统计信息，而是通过随机的索引访问进行评估并将其存储在内存中。可以使用SHOW INDEX FROM命令来查看索引的基数(Cardinality)。索引列的基数(Cardinality)显示了存储引擎估算索引列有多少个不同的取值。InnoDB引擎通过抽样的方式来计算统计信息**(估算值)**。

**何时维护呢？**

对InnoDB存储引擎而言，以下时候会计算索引的统计信息。
1. 表首次打开
2. 执行ANALYZE TABLE
3. 表的大小发生非常大的变化(大小变化超过十六分之一或者新插入了20亿行都会触发)

但是呢，还有另外一些时刻也会触发统计信息的更新：
1. 打开某些INFOMATION_SCHEMA表
2. 使用SHOW TABLE STATUS和SHOW INDEX
3. 在MySQL客户端开启自动补全功能的时候
如果服务器上有大量的数据，这可能就是个很严重的问题，尤其是当I/O比较慢的时候。客户端或者监控程序触发索引信息采集更新时可能会导致大量的锁，并给服务器带来很多的额外压力，这会让用户因为启动时间漫长而沮丧。所以，我们可以关闭**innodb_stats_on+metadata**参数来避免上面提到的问题。

---

言归正传，所以索引的基数(Cardinality)是优化器调用了两个API来决定如何使用索引：
- 第一个API是records_in_range()，实际的SQL中传参的最大值和最小值相差1471。
- 第二个API是info()，实际MySQL中的Cardinality只有3000-4000。
那么问题找到了，是Cardinality的值太小，对于18万行数据来说，这个区分度很小，说明还有很多重复的值。即使使用的索引，还需要进一步的区分才能找到正确的值。所以优化器觉得全表扫描花的成本更低。

**确认Cardinality的正确性**

使用ANALYZE TABLE tablename更新，查看后数据没变，所以数据正确。

#### 结论

由于该查询字段是后期新加并使用的字段，该数据为选填数据，所以存在很多值为0的数据。而使用时，并不会用到为0的数据，实际上使用索引还是最优的选择。最终，采用FORCE INDEX的手段使用索引。


## 参考文档
1. [Mysql 5.7 doc#8.2.1.20 Avoiding Full Table Scans](https://dev.mysql.com/doc/refman/5.7/en/table-scan-avoidance.html)
2. [Mysql 5.7 doc#5.1.7 Server System Variables](https://dev.mysql.com/doc/refman/5.7/en/server-system-variables.html)
3. [Mysql 5.7 doc#13.7.5.22 SHOW INDEX Statement](https://dev.mysql.com/doc/refman/5.7/en/show-index.html)
4. [Mysql 5.7 doc#13.7.2.1 ANALYZE TABLE Statement](https://dev.mysql.com/doc/refman/5.7/en/analyze-table.html)
5. [Mysql如何避免全表扫描的方法](https://www.cnblogs.com/jpfss/p/9176142.html)
6. [Mysql：max_seeks_for_key参数的设置](https://anmh.wordpress.com/2010/07/16/mysql%EF%BC%9Amax_seeks_for_key%E7%9A%84%E8%AE%BE%E7%BD%AE/)
7. 高性能MySQL第3版 Page188







