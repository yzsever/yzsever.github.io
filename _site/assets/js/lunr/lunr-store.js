var store = [{
        "title": "Hello World!",
        "excerpt":"很开心能够搭建自己的博客，记录生活学习中值得记录的东西。   ","categories": ["其他"],
        "tags": [],
        "url": "https://yzsever.github.io/%E5%85%B6%E4%BB%96/helloworld/",
        "teaser": null
      },{
        "title": "基于Docker搭建Mysql主从复制环境",
        "excerpt":"一、阿里云和Docker搭建主从服务器 1、阿里云环境为centos，首先安装docker ~# yum install docker-ce-3:19.03.13-3.el8 -y 2、然后拉取docker镜像，这里使用5.7版本的mysql： ~# docker pull mysql:5.7 3、使用此镜像启动容器，这里需要分别启动主从两个容器 Master(主)： ~# docker run -p 3309:3306 --name primary -e MYSQL_ROOT_PASSWORD=123456 -d mysql:5.7 Slave(从)： ~# docker run -p 3308:3306 --name secondary -e MYSQL_ROOT_PASSWORD=123456 -d mysql:5.7 primary对外映射的端口是3309，secondary对外映射的端口是3308。使用docker ps命令查看正在运行的容器： ~# docker ps CONTAINER ID IMAGE COMMAND CREATED STATUS PORTS NAMES...","categories": ["Mysql"],
        "tags": [],
        "url": "https://yzsever.github.io/mysql/mysql-replica/",
        "teaser": null
      },{
        "title": "Mysql慢查询优化——IN查询不走索引",
        "excerpt":"问题背景 最近优化慢查询时，发现由于业务的变更，之前不常用的字段作为了查询条件，慢查询日志中的rows达到了18万行，因为没有索引，所以进行了全表扫描。顾采取策略为改查询字段添加索引。添加索引后，使用explain分析语句，显示会使用索引。 业务修改时，业务人员撰写新SQL后，一定要使用explain命令进行评估。 索引上线后，过了一天再查看慢查询日志，发现该慢查询依然在列，依然全局扫描。 MySQL使用引擎InnoDB 问题分析 首先猜测一下可能是什么问题导致的： 索引没有上？ -&gt; 和运维人员确认后排除 SQL语句中使用了IN语句，IN语句可能会使用不到索引？ -&gt; 发现了optimizer会先分析选择使用索引还是全表扫描 立马google找到一个相关问题，MySQL not using indexes with WHERE IN clause?。先简单复述一下高票回答：Mysql中有一个优化器(optimizer)，在选择执行方案时，需要根据分析数据表(analyze table)的结果来选择最优的执行方案。分析数据正确的话，可以取得很好的效果，反之则需要重新分析数据表更正数据。如果在更正后分析数据后的性能你仍然不满意的话，可以使用强制使用索引的方法(force index)。 总而言之，Mysql优化器认为全表扫描比使用索引更快，帮我做了更好的选择，如果你实在想用索引，那就强制使用索引吧！ 那么问题来了：全表扫描真的比索引更快嘛？ 全表扫描真的比索引更快嘛？ MySQL的查询优化器会通过两个API来了解存储引擎的索引值的分布信息，以决定如何使用索引。 第一个API是records_in_range()，通过向存储引擎传入两个边界值获取在这个范围大概有多少条记录。对于某些存储引擎，该接口返回精确值，例如MyISAM；但对于另一些存储引擎则是一个估算值，例如InnoDB。 第二个API是info()，该接口返回各种类型的数据，包括索引的基数(每个键值有多少条记录)。 如果存储引擎向优化器提供的扫描行数信息是不准确的数据，或者执行计划本身太复杂以致无法准确地获取各个阶段匹配的行数，那么优化器会使用索引统计信息来估算扫描行数。MySQL优化器使用的是基于成本的模型，而衡量成本的主要指标就是一个查询需要扫描多少行。如果表没有统计信息，或者统计信息不准确，优化器就很有可能做出错误的决定。可以通过运行ANALYE TABLE来重新生成统计信息解决这个问题。 索引的基数(Cardinality) 直到MySQL 5.5版本，InnoDB也不在磁盘存储索引统计信息，而是通过随机的索引访问进行评估并将其存储在内存中。可以使用SHOW INDEX FROM命令来查看索引的基数(Cardinality)。索引列的基数(Cardinality)显示了存储引擎估算索引列有多少个不同的取值。InnoDB引擎通过抽样的方式来计算统计信息(估算值)。 何时维护呢？ 对InnoDB存储引擎而言，以下时候会计算索引的统计信息。 表首次打开 执行ANALYZE TABLE 表的大小发生非常大的变化(大小变化超过十六分之一或者新插入了20亿行都会触发) 但是呢，还有另外一些时刻也会触发统计信息的更新： 打开某些INFOMATION_SCHEMA表 使用SHOW TABLE STATUS和SHOW INDEX 在MySQL客户端开启自动补全功能的时候 如果服务器上有大量的数据，这可能就是个很严重的问题，尤其是当I/O比较慢的时候。客户端或者监控程序触发索引信息采集更新时可能会导致大量的锁，并给服务器带来很多的额外压力，这会让用户因为启动时间漫长而沮丧。所以，我们可以关闭innodb_stats_on+metadata参数来避免上面提到的问题。...","categories": ["Mysql"],
        "tags": [],
        "url": "https://yzsever.github.io/mysql/mysqlslowquery-in/",
        "teaser": null
      },{
        "title": "Mysql慢查询优化总览",
        "excerpt":"大厂的工作流程是业务人员完成业务开发中的sql语句后，由DBA对sql语句进行优化，最后进行上线。但是没有DBA的小厂，这部分需要开发人员掌握。Mysql作为系统的IO操作，一直是业务系统优化的大头。当系统的API调用过慢时，首先根据二八定律确定大量时间花在了什么地方，然后再对时间大头进行优化。在这个过程中，大多数会发现是mysql语句执行过慢的原因。   Sql语句执行过慢的原因     全表扫描，未使用索引   使用了索引，但是备选数据量太多   使用IN查询，条件太多不走索引   过多的表关联查询   ","categories": ["Mysql"],
        "tags": [],
        "url": "https://yzsever.github.io/mysql/mysqlslowquery/",
        "teaser": null
      },{
        "title": "Java工程师推荐书单",
        "excerpt":"基础入门 Java编程思想(Thinking in Java) Java核心技术(Core Java) Java8 实战(Java in action) Effective Java中文版 代码大全 框架入门与深入 Spring实战(Spring in action) Hibernate实战（Java Persistence with Hibernate） 深入分析Java Web技术内幕 互联网轻量级SSM框架解密 MyBatis 3源码深度解析 Spring技术内幕 Spring Boot技术内幕 Spring微服务实战 NIO与并发编程 Java并发编程实战（Java Concurrency in Practice） Java并发编程的艺术 Java异步编程实战 Netty实战 Netty权威指南 NIO与Socket编程技术指南 JVM与性能 深入理解Java虚拟机 深入理解JVM字节码 Java性能优化权威指南 Java性能权威指南 性能之巅 高可用MySQL 高性能MySQL 分布式与中间件 分布式系统：概念与设计...","categories": ["JAVA"],
        "tags": [],
        "url": "https://yzsever.github.io/java/java-read-list/",
        "teaser": null
      }]
