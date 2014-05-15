#!/usr/bin/env bash
git add --all
git commit -m 'just update'
git pull 
git push https://github.com/larssg/trafficjam.git
git push git@heroku.com:trafficjam-demo.git