FROM alpine:3.19
#
# Install packages
RUN apk -U --no-cache add \
		git \
		libcap \
		py3-pip \
		python3 && \
#
# Install mailoney from git
    git clone https://github.com/Cyb3rhq/mailoney /opt/mailoney && \
    cd /opt/mailoney && \
    pip3 install --break-system-packages -r requirements.txt && \
#
# Setup user, groups and configs
    addgroup -g 2000 mailoney && \
    adduser -S -H -s /bin/ash -u 2000 -D -g 2000 mailoney && \
    chown -R mailoney:mailoney /opt/mailoney && \
    setcap cap_net_bind_service=+ep $(readlink -f $(type -P python3)) && \
#
# Clean up
    apk del --purge git && \
    rm -rf /root/* /var/cache/apk/* /opt/mailoney/.git
#
# Set workdir and start mailoney
STOPSIGNAL SIGINT
USER mailoney:mailoney
WORKDIR /opt/mailoney/
CMD ["/usr/bin/python","mailoney.py","-i","0.0.0.0","-p","25","-s","mailrelay.local","-t","schizo_open_relay"]
