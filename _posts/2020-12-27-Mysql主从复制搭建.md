---
layout: single
title:  "基于Docker搭建Mysql主从复制环境"
date:   2020-12-27 19:45:00 +0800
categories: Mysql
toc: true
toc_label: "目录"
toc_icon: "align-left"
---

## 一、阿里云和Docker搭建主从服务器
1、阿里云环境为centos，首先安装docker
```
~# yum install docker-ce-3:19.03.13-3.el8 -y
```

2、然后拉取docker镜像，这里使用5.7版本的mysql：
```
~# docker pull mysql:5.7
```

3、使用此镜像启动容器，这里需要分别启动主从两个容器

Master(主)：
```
~# docker run -p 3309:3306 --name primary -e MYSQL_ROOT_PASSWORD=123456 -d mysql:5.7
```

Slave(从)：
```
~# docker run -p 3308:3306 --name secondary -e MYSQL_ROOT_PASSWORD=123456 -d mysql:5.7
```
primary对外映射的端口是3309，secondary对外映射的端口是3308。使用docker ps命令查看正在运行的容器：
```
~# docker ps
CONTAINER ID        IMAGE               COMMAND                  CREATED             STATUS              PORTS                               NAMES
c2e509a41b29        mysql:5.7           "docker-entrypoint.s…"   3 weeks ago         Up 2 weeks          33060/tcp, 0.0.0.0:3308->3306/tcp   secondary
ec4a868c061d        mysql:5.7           "docker-entrypoint.s…"   3 weeks ago         Up 2 weeks          33060/tcp, 0.0.0.0:3309->3306/tcp   primary
```
4、容器中Mysql测试：使用主宿主机IP:3309,和主宿主机IP:3308连接Mysql，能够连通则第一步成功。
```
~# mysql -h 主宿主机IP -P 3309 -uroot -p123456 
```

> 阿里云需要配置暴露端口规则暴露3308和3309端口

## 二、配置主数据库(primary)
1、进入到primary容器内部，修改mysql的配置文件my.cnf，配置server-id。
```
~# docker exec -it ec4 /bin/bash
root@ec4a868c061d:/# apt-get update
root@ec4a868c061d:/# apt-get install vim
root@ec4a868c061d:/# cd /etc/mysql
root@ec4a868c061d:/# vim my.cnf
```
my.cnf的内容如下：
```
[mysqld]
## 同一局域网内注意要唯一
server-id=100  
## 开启二进制日志功能，可以随便取（关键）
log-bin=mysql-bin
```
配置完成之后，需要重启mysql服务使配置生效。
```
root@ec4a868c061d:/# service mysql restart
~# docker start ec4
```

2、在primary数据库创建数据同步用户，授予用户slave REPLICATION SLAVE权限和REPLICATION CLIENT权限，用于在主从库之间同步数据。
```
root@ec4a868c061d:/# mysql -uroot -p123456
mysql> flush privileges; 
mysql> CREATE USER 'secondary'@'%' IDENTIFIED BY '123456';
mysql> GRANT REPLICATION SLAVE, REPLICATION CLIENT ON *.* TO 'secondary'@'%';
```
> (创建用户前先刷新一下权限，不然可能报错。参考：https://blog.csdn.net/u011575570/article/details/51438841)

## 三、配置从数据库(secondary)

和配置主数据库一样，配置文件my.cnf中添加如下配置：
```
[mysqld]
## 设置server_id,注意要唯一
server-id=101  
## 开启二进制日志功能，以备Slave作为其它Slave的Master时使用
log-bin=mysql-slave-bin   
## relay_log配置中继日志
relay_log=edu-mysql-relay-bin
```

配置完成后也需要重启mysql服务和docker容器。

## 四、开启主从复制
1、在Primary进入mysql，执行show master status;
```
mysql> show master status;
+------------------+----------+--------------+------------------+-------------------+
| File             | Position | Binlog_Do_DB | Binlog_Ignore_DB | Executed_Gtid_Set |
+------------------+----------+--------------+------------------+-------------------+
| mysql-bin.000007 |     4638 |              |                  |                   |
+------------------+----------+--------------+------------------+-------------------+
1 row in set (0.00 sec)
```
File和Position字段的值后面将会用到，在后面的操作完成之前，需要保证Master库不能做任何操作，否则将会引起状态变化，File和Position字段的值变化。

2、查看主数据库Primary容器的IP地址
```
~# docker inspect --format='{{.NetworkSettings.IPAddress}}' ec4
172.17.0.2
```

3、在从数据库中进入mysql，设置master信息
```
mysql> change master to master_host='172.17.0.2', master_user='secondary', master_password='123456', master_port=3306, master_log_file='mysql-bin.000007', master_log_pos= 4638, master_connect_retry=30;
```
4、查看主从复制的状态：
```
mysql> show slave status\G;
*************************** 1. row ***************************
               Slave_IO_State: Waiting for master to send event
                  Master_Host: 172.17.0.2
                  Master_User: secondary
                  Master_Port: 3306
                Connect_Retry: 30
              Master_Log_File: mysql-bin.000007
          Read_Master_Log_Pos: 4638
               Relay_Log_File: edu-mysql-relay-bin.000002
                Relay_Log_Pos: 320
        Relay_Master_Log_File: mysql-bin.000007
             Slave_IO_Running: Yes
            Slave_SQL_Running: Yes
              Replicate_Do_DB: 
          Replicate_Ignore_DB: 
           Replicate_Do_Table: 
       Replicate_Ignore_Table: 
      Replicate_Wild_Do_Table: 
  Replicate_Wild_Ignore_Table: 
                   Last_Errno: 0
                   Last_Error: 
                 Skip_Counter: 0
          Exec_Master_Log_Pos: 4638
              Relay_Log_Space: 531
              Until_Condition: None
               Until_Log_File: 
                Until_Log_Pos: 0
           Master_SSL_Allowed: No
           Master_SSL_CA_File: 
           Master_SSL_CA_Path: 
              Master_SSL_Cert: 
            Master_SSL_Cipher: 
               Master_SSL_Key: 
        Seconds_Behind_Master: 0
Master_SSL_Verify_Server_Cert: No
                Last_IO_Errno: 0
                Last_IO_Error: 
               Last_SQL_Errno: 0
               Last_SQL_Error: 
  Replicate_Ignore_Server_Ids: 
             Master_Server_Id: 1001
                  Master_UUID: c413bb6f-36ed-11eb-b373-0242ac110002
             Master_Info_File: /var/lib/mysql/master.info
                    SQL_Delay: 0
          SQL_Remaining_Delay: NULL
      Slave_SQL_Running_State: Slave has read all relay log; waiting for more updates
           Master_Retry_Count: 86400
                  Master_Bind: 
      Last_IO_Error_Timestamp: 
     Last_SQL_Error_Timestamp: 
               Master_SSL_Crl: 
           Master_SSL_Crlpath: 
           Retrieved_Gtid_Set: 
            Executed_Gtid_Set: 
                Auto_Position: 0
         Replicate_Rewrite_DB: 
                 Channel_Name: 
           Master_TLS_Version: 
1 row in set (0.00 sec)
```
注意其中两个状态，如果两个都是Yes，则说明环境搭建完成。如果不是，请关注错误信息字段：Last_IO_Error
```
Slave_IO_Running: Yes
Slave_SQL_Running: Yes
```

## 五、花式掉坑
1. 最后一步查看show slave status状态时，Slave_IO_Running显示为Connecting，Last_IO_Error错误信息提示连接不到主数据库。
   - 这个时候连接是通过docker容器的内网，理论上不会出现问题。但是，在容器中执行apt-get update的时候就一直显示连不上网，很是奇怪。最后经过层层排查，是docker本身的问题。所以卸载了docker，换版本后制定版本安装docker，最后问题解决。



## 参考文档
1. [基于Docker的Mysql主从复制搭建](https://www.cnblogs.com/linjiaxin/p/12761296.html)