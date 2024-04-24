---
title: Redis-Cluster 伪集群安装
order: 1
date: 2024-04-24 22:37:00
editLink: false
star: true
category:
  - 运维
tag:
  - Nosql
  - Redis
---

Redis-Cluster本地Docker伪集群安装配置,以及相关知识点.[Redis Cluster 官方](https://redis.io/docs/latest/operate/oss_and_stack/management/scaling/) 

<!-- more -->

[//]: # (## Redis 介绍)

[//]: # ()
[//]: # ([Redis官网]&#40;https://redis.io/&#41;)

## Redis-Cluster 安装
### 环境准备
```angular2html
客户端版本: mac-docker-desktop 4.29.0(145265)
Docker版本: 26.0.0
Redis版本: 7.2.4
```
### 安装准备
- 拉取镜像

```shell
docker pull redis:latest # 最新的版本是7.2.4(截止安装)
```

- 创建虚拟网卡

```shell
docker network create redis-cluster # [name] 根据自己喜好,只要是不重复
```

- 其他相关命令

```shell
docker network inspect redis-cluster # 查看网卡信息
docker network rm redis-cluster # 删除相关的网卡信息
docker network --help # 帮助命令,可以查看其他相关命令
```

- 执行脚本文件

```shell
for port in $(seq 6379 6384); 
do 
mkdir -p ~/redis/node-${port}/conf
touch ~/redis/node-${port}/conf/redis.conf
cat  << EOF > ~/redis/node-${port}/conf/redis.conf
port ${port}
requirepass 123456
bind 0.0.0.0
protected-mode no
daemonize no
appendonly yes
cluster-enabled yes 
cluster-config-file nodes.conf
cluster-node-timeout 5000
cluster-announce-ip 宿主机ip,否则无法远程访问
cluster-announce-port ${port}
cluster-announce-bus-port 1${port}
EOF
done
```
```angular2html 
port：节点端口
requirepass：设置密码,访问时需要验证
protected-mode：保护模式,默认值yes,即开启.开启保护模式以后,需配置bind ip
                或者设置访问密码；关闭保护模式，外部网络可以直接访问
daemonize：是否以守护线程的方式启动(后台启动),默认 no
appendonly：是否开启 AOF持久化模式,默认 no
cluster-enabled：是否开启集群模式,默认 no
cluster-config-file：集群节点信息文件
cluster-node-timeout：集群节点连接超时时间
cluster-announce-ip：集群节点ip 填写宿主机ip
cluster-announce-port：集群节点映射端口
cluster-announce-bus-port：集群节点总线端口
```
##### 创建成功后,对应的~/redis目录会创建成功6个目录和对应的子目录以及conf文件

### 容器配置
- 启动容器

```shell
for port in $(seq 6379 6384); \
do \
   docker run -it -d -p ${port}:${port} -p 1${port}:1${port} \
  --privileged=true -v ~/redis/node-${port}/conf/redis.conf:/usr/local/etc/redis/redis.conf \
  --privileged=true -v ~/redis/node-${port}/data:/data \
  --restart always --name redis-${port} --net redis-cluster \
  --sysctl net.core.somaxconn=1024 redis redis-server /usr/local/etc/redis/redis.conf
done
```
```angular2html
-it: 交互
-d: 后台运行,容器启动完成后打印容器
--privileged: 是否让docker应用容器获取宿主机root权限
-p: 端口映射
-v: 文件挂载
--sysctl 参数来设置系统参数，通过这些参数来调整系统性能
--restart always: 在容器退出时总是重启容器
--name: 给容器取名
--net redis-cluster: 使用创建的虚拟网卡
```

- 查看容器

```shell
docker ps -a # 脚本执行完成后,查看容器状态
```

### 集群配置
- 进入任意容器

```shell
docker exec -it redis-6379 /bin/bash
```

- 创建集群

```shell
redis-cli -a [requirepass] --cluster create \
       [cluster-announce-ip]:6379 \
       [cluster-announce-ip]:6380 \
       [cluster-announce-ip]:6381 \
       [cluster-announce-ip]:6382 \
       [cluster-announce-ip]:6383 \
       [cluster-announce-ip]:6384 \
       --cluster-replicas 1 
       #如果一切正常,会提示确定,输入yes即可
```
- 查看集群状态

```shell
redis-cli -c -a [requirepass]  #进入集群
cluster info # 查看集群信息
cluster nodes # 查看节点状态
```

### 客户端

Redis开源客户端工具[AnotherRedisDesktopManager](https://github.com/qishibo/AnotherRedisDesktopManager)