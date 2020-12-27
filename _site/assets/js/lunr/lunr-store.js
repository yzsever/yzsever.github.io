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
      }]
