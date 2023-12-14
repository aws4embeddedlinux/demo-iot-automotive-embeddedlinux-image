# depending on the build machine this allow you to use kvm when running qemu - see runqemu below
MACHINE = "qemuarm64"

SDKMACHINE = "x86_64"

# those are required to build gg-obs components
TOOLCHAIN_TARGET_TASK += "aws-iot-device-sdk-cpp-v2-dev fmt-dev aws-crt-cpp-dev"

# ggc_user, ggc_group, user, users and groupds needs to added to meta-agl/meta-agl-core/files/passwd meta-agl/meta-agl-core/files/group when enabled
USERADD_ERROR_DYNAMIC = "0"

# systemd
DISTRO_FEATURES:append = " systemd"
VIRTUAL-RUNTIME_init_manager = "systemd"
VIRTUAL-RUNTIME_initscripts = ""
VIRTUAL-RUNTIME_syslog = ""

# this will force bitbake to use meta-aws crt recipe over ROS ones
BBFILE_PRIORITY_meta-aws = "99"

# build and install vcan support
KERNEL_FEATURES:append = " features/can/can.scc"

IMAGE_INSTALL =+ "iproute2 canutils"

#this is the qemu adapter
IMAGE_INSTALL =+ "kernel-module-kvaser-pci"
KERNEL_MODULE_AUTOLOAD =+ "kvaser-pci"

KERNEL_MODULE_AUTOLOAD =+ "c-can-platform"
KERNEL_MODULE_AUTOLOAD =+ "can-dev"
KERNEL_MODULE_AUTOLOAD =+ "c-can"
KERNEL_MODULE_AUTOLOAD =+ "can-bcm"
KERNEL_MODULE_AUTOLOAD =+ "can-gw"
KERNEL_MODULE_AUTOLOAD =+ "can-raw"

KERNEL_MODULE_AUTOLOAD =+ "can"
KERNEL_MODULE_AUTOLOAD =+ "vcan"

# GG needs more mem than default
QB_MEM = "-m 2048"

PACKAGECONFIG:pn-greengrass-bin += "fleetprovisioning"

# this needs to be done in local.conf
KERNEL_MODULE_AUTOLOAD += "vcan"

IMAGE_INSTALL += "vcan-ec2-multicast-receiver"

GGV2_THING_NAME  = "vCar"

# create vcan0 network interface
IMAGE_INSTALL += "vcan0-netdev-config"

# create can0 network interface
IMAGE_INSTALL += "can0-netdev-config"
