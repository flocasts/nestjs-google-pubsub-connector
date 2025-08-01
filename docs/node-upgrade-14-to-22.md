# 🚀 Upgrade to Node.js 22 and Latest Dependencies

## Overview

This PR updates the NestJS Google PubSub Connector to Node.js 22 and upgrades all dependencies to their latest stable versions, including a major upgrade of the Google Cloud PubSub SDK from v2 to v4.

## 🎯 Key Changes

### Node.js & Runtime

- ⬆️ **Node.js**: Added requirement for Node.js 22+ (`"node": ">=22.0.0"`)
- ⬆️ **npm**: Added requirement for npm 10+ (`"npm": ">=10.0.0"`)
- 📄 **Added `.nvmrc`** with Node.js version 22

### Major Dependency Upgrades

#### Core Dependencies

- 🔥 **@google-cloud/pubsub**: `^2.10.0` → `^4.7.2` (Major performance improvements & new features)

#### NestJS Ecosystem

- 🔄 **@nestjs/\*** packages: `^7.6.15` → `^10.4.1` (Major NestJS v10 upgrade)
- 🔄 **Peer dependencies**: Updated to require NestJS v10+

#### Development Tools

- 🛠️ **TypeScript**: `^4.2.4` → `^5.5.4`
- 🧪 **Jest**: `^28.1.0` → `^29.7.0` (with improved ts-jest preset)
- 📏 **ESLint**: `^7.23.0` → `^9.8.0`
- 🎨 **Prettier**: `2.2.1` → `^3.3.3`
- 🔧 **Husky**: `^6.0.0` → `^9.1.4`

#### Type Definitions

- 📝 **@types/jest**: `^27.5.1` → `^29.5.12`
- 📝 **@types/supertest**: `^2.0.12` → `^6.0.2`
- 📝 **@types/uuid**: `^8.3.0` → `^10.0.0`

## 🔧 Configuration Updates

### TypeScript

- 🎯 **Target**: Updated from `ES2018` → `ES2022` (compatible with Node.js 22)

### Jest

- ✅ Added `preset: 'ts-jest'` to both main and e2e configurations

### Husky

- 🔄 Updated for Husky v9: `husky install` → `husky`
- 🧹 Removed deprecated inline configuration from package.json

## 🐛 Compatibility Fixes

### NestJS v10 API Changes

- 🔧 **examples/server/main.ts**: Updated `app.listen()` to promise-based API
- 🔧 **test/server/server.e2e-spec.ts**: Replaced `app.listenAsync()` with `app.listen()`

## ✅ Testing & Verification

- ✅ **Unit Tests**: All 48 tests passing
- ✅ **E2E Tests**: All 12 tests passing
- ✅ **Build**: Compiles successfully with TypeScript 5.5
- ✅ **Security**: No vulnerabilities detected
- ✅ **Runtime**: Verified compatibility with Node.js 22.5.1

## 🚨 Breaking Changes

This is a **major version upgrade** that includes:

- **Node.js 22 requirement** - older Node.js versions no longer supported
- **NestJS v10** - consumers must upgrade to NestJS v10+
- **Google Cloud PubSub v4** - API changes may affect advanced usage patterns

## 📋 Migration Notes

For consumers of this package:

1. Upgrade to Node.js 22+
2. Upgrade to NestJS v10+
3. Review Google Cloud PubSub v4 [migration guide](https://cloud.google.com/pubsub/docs/release-notes) for any breaking changes

## 📊 Impact

- 🚀 **Performance**: Significant improvements from Google Cloud PubSub v4
- 🔒 **Security**: Latest security patches across all dependencies
- 🛠️ **Developer Experience**: Modern tooling with TypeScript 5.5 and Jest 29
- 🔮 **Future-Ready**: Positioned for upcoming Node.js and NestJS features
