#!/usr/bin/env bash
git add --all
git commit -m 'just update'
git pull https://github.com/larssg/trafficjam.git
git pull git@heroku.com:trafficjam-demo.git
git push https://github.com/larssg/trafficjam.git
git push git@heroku.com:trafficjam-demo.git

# to quite vim: esc + :wq