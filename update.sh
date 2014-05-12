#!/usr/bin/env bash
git add --all
git commit -m 'just update'
git pull 
git push origin master
git push git@heroku.com:trafficjam-demo.git