#!/bin/bash

src_dir="$1"
dest_dir="$2"

opts1="\
--recursive \
--delete \
--update \
--perms \
--times \
--omit-dir-times \
--checksum \
--human-readable \
--include=app/ \
--include=kixx/ \
--include=plugins/ \
--include=.env.development \
--include=cloudflare-server.js \
--include=node-server.js \
--include=node-config.json \
--include=virtual-hosts.js \
--exclude=/* \
"

rsync $opts1 "$src_dir" "$dest_dir"
