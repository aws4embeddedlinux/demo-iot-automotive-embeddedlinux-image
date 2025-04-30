#!/bin/bash
set -e

TOKEN=`curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600"`
export IP=$(curl -H "X-aws-ec2-metadata-token: $TOKEN" -s http://169.254.169.254/latest/meta-data/local-ipv4)
echo "my ip: $IP"
socat UDP4-RECVFROM:3030,ip-add-membership=239.255.0.1:$IP,fork - | while read line; do cansend vcan0 $line; done
