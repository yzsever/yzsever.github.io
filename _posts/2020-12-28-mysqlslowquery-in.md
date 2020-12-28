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




## 如何避免全表扫描




## 参考文档
1. [Mysql 5.7 doc#8.2.1.20 Avoiding Full Table Scans](https://dev.mysql.com/doc/refman/5.7/en/table-scan-avoidance.html)
2. [Mysql 5.7 doc#5.1.7 Server System Variables](https://dev.mysql.com/doc/refman/5.7/en/server-system-variables.html)
3. [Mysql 5.7 doc#13.7.5.22 SHOW INDEX Statement](https://dev.mysql.com/doc/refman/5.7/en/show-index.html)
4. [Mysql 5.7 doc#13.7.2.1 ANALYZE TABLE Statement](https://dev.mysql.com/doc/refman/5.7/en/analyze-table.html)
5. [Mysql如何避免全表扫描的方法](https://www.cnblogs.com/jpfss/p/9176142.html)
6. [Mysql：max_seeks_for_key参数的设置](https://anmh.wordpress.com/2010/07/16/mysql%EF%BC%9Amax_seeks_for_key%E7%9A%84%E8%AE%BE%E7%BD%AE/)
7. 高性能MySQL第3版 Page188







