SUMMARY     = "Setting up vcan0"
LICENSE     = "MIT"
LIC_FILES_CHKSUM = "file://${COMMON_LICENSE_DIR}/MIT;md5=0835ade698e0bcf8506ecda2f7b4f302"

inherit systemd

SRC_URI = "file://vcan0.netdev \
"

do_configure[noexec] = "1"
do_compile[noexec] = "1"

do_install() {
    # Install systemd-networkd vcan0 configuration
    install -d ${D}${systemd_unitdir}/network
    install -m 0644 ${WORKDIR}/vcan0.netdev ${D}${systemd_unitdir}/network/
}

FILES:${PN} += "${systemd_unitdir}/network ${systemd_system_unitdir}"

RDEPENDS:${PN} += "kernel-module-vcan"
