# biga-qemu
run biga demo on qemu with virtual CAN support

## Build image
```bash
repo init -u https://github.com/aws4embeddedlinux/demo-iot-automotive-embeddedlinux-image.git -m manifest.xml -b main

repo sync

source meta-agl/scripts/aglsetup.sh  -f -m biga-qemu -b build-biga-qemu

bitbake aws-biga-image
```

## RUN QEMU and create can0 interface in the qemu biga image
```bash
runqemu slirp nographic qemuparams="-object can-bus,id=canbus0 -object can-host-socketcan,id=canhost0,if=vcan0,canbus=canbus0  -device kvaser_pci,canbus=canbus0"
#(with kvm enabled) runqemu kvm slirp nographic qemuparams="-object can-bus,id=canbus0 -object can-host-socketcan,id=canhost0,if=vcan0,canbus=canbus0  -device kvaser_pci,canbus=canbus0"
ip link set can0 type can bitrate 1000000
ip link set up can0

candump can0
```

## Setup vcan on the build machine
```bash
sudo apt-get install -y linux-modules-extra-$(uname -r)
sudo modprobe vcan
sudo ip link add dev vcan0 type vcan
sudo ip link set up vcan0
```

### Send a can message to the vcan0 interface
If the qemu is up and running it should receive it.
```bash
cansend vcan0 123#00FFAA5501020304
```

## additional information
https://www.pragmaticlinux.com/2021/10/how-to-create-a-virtual-can-interface-on-linux/
https://github.com/samoshkin/tmux-config#nested-tmux-sessions
