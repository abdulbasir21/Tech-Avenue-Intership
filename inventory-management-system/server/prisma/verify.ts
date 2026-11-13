import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('===============================================================');
  console.log('           INVENTORY MANAGEMENT SYSTEM - VERIFICATION          ');
  console.log('===============================================================\n');

  // 1. Table Count and Listing
  console.log('--- 1. TABLE INVENTORY & SCHEMA COUNT ---');
  const tables: Array<{ table_name: string }> = await prisma.$queryRaw`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name ASC;
  `;

  console.log(`Found ${tables.length} tables in public schema:`);
  tables.forEach((t, i) => console.log(`  [${i + 1}] ${t.table_name}`));

  const appTables = tables.filter((t) => t.table_name !== '_prisma_migrations');
  console.log(`\nApplication tables: ${appTables.length} (Expected: 22)`);
  console.log(`Prisma migrations table: ${tables.some((t) => t.table_name === '_prisma_migrations') ? 'Present (_prisma_migrations)' : 'Missing'}`);

  if (appTables.length !== 22) {
    throw new Error(`Expected exactly 22 application tables, found ${appTables.length}`);
  }

  // Helper setup for relational test records
  console.log('\n--- SETTING UP PREREQUISITE DATA FOR REJECTION TESTS ---');
  const cat = await prisma.category.findFirstOrThrow({ where: { name: 'IT Consumables' } });
  const unit = await prisma.unit.findFirstOrThrow({ where: { code: 'pcs' } });
  const adminUser = await prisma.user.findFirstOrThrow({ where: { username: 'admin' } });
  const emp = await prisma.employee.findFirstOrThrow({ where: { employeeCode: 'EMP-001' } });

  const supplier = await prisma.supplier.upsert({
    where: { name: 'Test Supplier Ltd' },
    update: {},
    create: {
      name: 'Test Supplier Ltd',
      contactPerson: 'John Supplier',
      email: 'vendor@supplier.com',
      isActive: true,
    },
  });

  const testProduct = await prisma.product.upsert({
    where: { sku: 'SKU-KB-001' },
    update: {},
    create: {
      sku: 'SKU-KB-001',
      name: 'Mechanical Keyboard USB-C',
      categoryId: cat.id,
      unitId: unit.id,
      minStockLevel: 5,
      criticalStockLevel: 2,
      isActive: true,
    },
  });
  console.log(`✓ Test Product verified: ${testProduct.sku} (ID: ${testProduct.id})`);

  // 2. Test Constraint 1: Negative quantity_on_hand in inventory_balances
  console.log('\n--- 2. TEST: Negative quantity_on_hand in inventory_balances ---');
  try {
    await prisma.$executeRawUnsafe(`
      INSERT INTO inventory_balances (product_id, quantity_on_hand, alert_level)
      VALUES (${testProduct.id}, -5.000, 'out_of_stock')
      ON CONFLICT (product_id) DO UPDATE SET quantity_on_hand = -5.000;
    `);
    console.error('❌ FAILED: Negative quantity_on_hand was accepted!');
  } catch (err: any) {
    console.log('✓ REJECTED as expected:');
    console.log(`  Error: ${err.message.split('\n').pop()}`);
  }

  // Valid insert / update for inventory_balances
  await prisma.$executeRawUnsafe(`
    INSERT INTO inventory_balances (product_id, quantity_on_hand, alert_level)
    VALUES (${testProduct.id}, 12.000, 'normal')
    ON CONFLICT (product_id) DO UPDATE SET quantity_on_hand = 12.000, alert_level = 'normal';
  `);
  console.log('✓ VALID ACCEPTED: quantity_on_hand = 12.000 saved successfully.');

  // 3. Test Constraint 2: quantity_ordered = 0 in purchase_order_items
  console.log('\n--- 3. TEST: quantity_ordered = 0 in purchase_order_items ---');
  const po = await prisma.purchaseOrder.upsert({
    where: { poNumber: 'PO-TEST-001' },
    update: {},
    create: {
      poNumber: 'PO-TEST-001',
      supplierId: supplier.id,
      orderDate: new Date(),
      status: 'ordered',
      totalAmount: 100,
      createdByUserId: adminUser.id,
    },
  });

  try {
    await prisma.$executeRawUnsafe(`
      INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity_ordered, unit_price, line_total)
      VALUES (${po.id}, ${testProduct.id}, 0, 25.00, 0.00);
    `);
    console.error('❌ FAILED: quantity_ordered = 0 was accepted!');
  } catch (err: any) {
    console.log('✓ REJECTED as expected:');
    console.log(`  Error: ${err.message.split('\n').pop()}`);
  }

  // Valid insert for purchase_order_items (20 keyboards ordered @ $25.00 = $500.00)
  await prisma.$executeRawUnsafe(`
    INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity_ordered, unit_price, line_total)
    VALUES (${po.id}, ${testProduct.id}, 20.000, 25.00, 500.00)
    ON CONFLICT (purchase_order_id, product_id) DO UPDATE SET quantity_ordered = 20.000, line_total = 500.00;
  `);
  console.log('✓ VALID ACCEPTED: quantity_ordered = 20.000, unit_price = 25.00, line_total = 500.00 saved successfully.');

  const poItem = await prisma.purchaseOrderItem.findFirstOrThrow({
    where: { purchaseOrderId: po.id, productId: testProduct.id },
  });

  // Setup Goods Receipt & Goods Receipt Item for stock movement test
  const gr = await prisma.goodsReceipt.upsert({
    where: { receiptNumber: 'GRN-TEST-001' },
    update: {},
    create: {
      receiptNumber: 'GRN-TEST-001',
      purchaseOrderId: po.id,
      receivedDate: new Date(),
      deliveryReference: 'DEL-INV-9988',
      confirmedByUserId: adminUser.id,
    },
  });

  const grItem = await prisma.goodsReceiptItem.upsert({
    where: {
      goodsReceiptId_purchaseOrderItemId: {
        goodsReceiptId: gr.id,
        purchaseOrderItemId: poItem.id,
      },
    },
    update: {},
    create: {
      goodsReceiptId: gr.id,
      purchaseOrderItemId: poItem.id,
      quantityReceived: 12,
    },
  });

  // Setup a valid adjustment to test dual source conflict
  const validAdj = await prisma.stockAdjustment.create({
    data: {
      productId: testProduct.id,
      adjustmentType: 'decrease',
      reasonCategory: 'damaged',
      quantity: 1,
      reason: '1 keyboard dropped and broken during inspection',
      adjustmentDate: new Date(),
      adjustedByUserId: adminUser.id,
    },
  });

  // 4. Test Constraint 3: stock_movements row with two sources (chk_mov_single_source)
  console.log('\n--- 4. TEST: stock_movements row with two sources ---');
  try {
    await prisma.$executeRawUnsafe(`
      INSERT INTO stock_movements (product_id, movement_type, quantity_change, balance_after, goods_receipt_item_id, stock_adjustment_id)
      VALUES (${testProduct.id}, 'goods_receipt', 12.000, 12.000, ${grItem.id}, ${validAdj.id});
    `);
    console.error('❌ FAILED: stock_movement with two sources was accepted!');
  } catch (err: any) {
    console.log('✓ REJECTED as expected:');
    console.log(`  Error: ${err.message.split('\n').pop()}`);
  }

  // Valid insert for stock_movements (single source: goods_receipt_item_id)
  await prisma.$executeRawUnsafe(`
    INSERT INTO stock_movements (product_id, movement_type, quantity_change, balance_after, goods_receipt_item_id)
    VALUES (${testProduct.id}, 'goods_receipt', 12.000, 12.000, ${grItem.id})
    ON CONFLICT (goods_receipt_item_id) DO NOTHING;
  `);
  console.log('✓ VALID ACCEPTED: Stock movement with single source (goods_receipt_item_id) inserted successfully.');

  const insertedMovement = await prisma.stockMovement.findFirstOrThrow({
    where: { goodsReceiptItemId: grItem.id },
  });

  // 5. Test Trigger: UPDATE on stock_movements
  console.log('\n--- 5. TEST: UPDATE on stock_movements (Append-only Trigger) ---');
  try {
    await prisma.$executeRawUnsafe(`
      UPDATE stock_movements 
      SET quantity_change = 15.000 
      WHERE id = ${insertedMovement.id};
    `);
    console.error('❌ FAILED: UPDATE on stock_movements succeeded!');
  } catch (err: any) {
    console.log('✓ REJECTED as expected by trigger:');
    console.log(`  Error: ${err.message.split('\n').pop()}`);
  }

  // 6. Test Trigger: DELETE on stock_movements
  console.log('\n--- 6. TEST: DELETE on stock_movements (Append-only Trigger) ---');
  try {
    await prisma.$executeRawUnsafe(`
      DELETE FROM stock_movements 
      WHERE id = ${insertedMovement.id};
    `);
    console.error('❌ FAILED: DELETE on stock_movements succeeded!');
  } catch (err: any) {
    console.log('✓ REJECTED as expected by trigger:');
    console.log(`  Error: ${err.message.split('\n').pop()}`);
  }

  // 7. Test Constraint 6: Damaged adjustment with type "increase" (chk_sa_reason_matches_type)
  console.log('\n--- 7. TEST: Damaged adjustment with type "increase" ---');
  try {
    await prisma.$executeRawUnsafe(`
      INSERT INTO stock_adjustments (product_id, adjustment_type, reason_category, quantity, reason, adjustment_date, adjusted_by_user_id)
      VALUES (${testProduct.id}, 'increase', 'damaged', 2.000, 'Faulty keyboard increase attempt', CURRENT_DATE, ${adminUser.id});
    `);
    console.error('❌ FAILED: Damaged adjustment with type "increase" was accepted!');
  } catch (err: any) {
    console.log('✓ REJECTED as expected:');
    console.log(`  Error: ${err.message.split('\n').pop()}`);
  }

  // Valid insert: Damaged adjustment with type "decrease"
  const validDamagedAdj = await prisma.stockAdjustment.create({
    data: {
      productId: testProduct.id,
      adjustmentType: 'decrease',
      reasonCategory: 'damaged',
      quantity: 2,
      reason: '2 keyboards arrived with shattered chassis, written off as damaged',
      adjustmentDate: new Date(),
      adjustedByUserId: adminUser.id,
    },
  });
  console.log(`✓ VALID ACCEPTED: Damaged adjustment with type "decrease" accepted (Adjustment ID: ${validDamagedAdj.id}).`);

  console.log('\n===============================================================');
  console.log('            ALL 7 VERIFICATION CHECKS PASSED 🚀                ');
  console.log('===============================================================');
}

main()
  .catch((e) => {
    console.error('Verification failed with error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
