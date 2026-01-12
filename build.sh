#!/bin/bash

echo "📦 Installing dependencies..."
npm install

echo "🔧 Generating Prisma client..."
npx prisma generate

echo "🗄️ Pushing database schema..."
npx prisma db push --accept-data-loss

echo "📊 Importing products..."
npm run import-products

echo "✅ Build complete!"
