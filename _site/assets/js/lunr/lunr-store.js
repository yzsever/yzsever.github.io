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
        "excerpt":"问题背景 最近优化慢查询时，发现由于业务的变更，之前不常用的字段作为了查询条件，慢查询日志中的rows达到了18万行，因为没有索引，所以进行了全表扫描。顾采取策略为改查询字段添加索引。添加索引后，使用explain分析语句，显示会使用索引。 业务修改时，业务人员撰写新SQL后，一定要使用explain命令进行评估。 索引上线后，过了一天再查看慢查询日志，发现该慢查询依然在列，依然全局扫描。 MySQL使用引擎InnoDB 问题分析 首先猜测一下可能是什么问题导致的： 索引没有上？ -&gt; 和运维人员确认后排除 SQL语句中使用了IN语句，IN语句可能会使用不到索引？ -&gt; 发现了optimizer会先分析选择使用索引还是全表扫描 立马google找到一个相关问题，MySQL not using indexes with WHERE IN clause?。先简单复述一下高票回答：Mysql中有一个优化器(optimizer)，在选择执行方案时，需要根据分析数据表(analyze table)的结果来选择最优的执行方案。分析数据正确的话，可以取得很好的效果，反之则需要重新分析数据表更正数据。如果在更正后分析数据后的性能你仍然不满意的话，可以使用强制使用索引的方法(force index)。 总而言之，Mysql优化器认为全表扫描比使用索引更快，帮我做了更好的选择，如果你实在想用索引，那就强制使用索引吧！ 那么问题来了：全表扫描真的比索引更快嘛？ 全表扫描真的比索引更快嘛？ MySQL的查询优化器会通过两个API来了解存储引擎的索引值的分布信息，以决定如何使用索引。 如何避免全表扫描 参考文档 Mysql 5.7 doc#8.2.1.20 Avoiding Full Table Scans Mysql 5.7 doc#5.1.7 Server System Variables Mysql 5.7 doc#13.7.5.22 SHOW INDEX Statement Mysql 5.7...","categories": ["Mysql"],
        "tags": [],
        "url": "https://yzsever.github.io/mysql/mysqlslowquery-in/",
        "teaser": null
      },{
        "title": "Mysql慢查询优化总览",
        "excerpt":"大厂的工作流程是业务人员完成业务开发中的sql语句后，由DBA对sql语句进行优化，最后进行上线。但是没有DBA的小厂，这部分需要开发人员掌握。Mysql作为系统的IO操作，一直是业务系统优化的大头。当系统的API调用过慢时，首先根据二八定律确定大量时间花在了什么地方，然后再对时间大头进行优化。在这个过程中，大多数会发现是mysql语句执行过慢的原因。   Sql语句执行过慢的原因     全表扫描，未使用索引   使用了索引，但是备选数据量太多   使用IN查询，条件太多不走索引   过多的表关联查询   ","categories": ["Mysql"],
        "tags": [],
        "url": "https://yzsever.github.io/mysql/mysqlslowquery/",
        "teaser": null
      }]
