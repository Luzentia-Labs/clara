#!/usr/bin/env node
// Every app must be private. npm releases are immutable (D0006): an app published by
// accident cannot be unpublished, only deprecated. US-01M0GMPJ edge case 7.
import { readWorkspace, fail, pass } from './lib/workspace.mjs'

const apps = readWorkspace().filter(p => p.kind === 'apps')
const leaks = apps.filter(a => a.manifest.private !== true)
  .map(a => `${a.dir}: "${a.manifest.name}" is missing "private": true - it could be published`)

if (leaks.length) fail('private', leaks)
pass('private', `${apps.length} app(s), all private`)
