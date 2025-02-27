import '../../../api2/utils/failOnError'

import { handler2 } from ".";
import { ADAPTER_TYPES } from "../triggerStoreAdaptorData";
import { AdapterType } from '@defillama/dimension-adapters/adapters/types';
import { getUnixTimeNow } from '../../../api2/utils/time';
import { elastic } from '@defillama/sdk';

async function run() {
  const startTimeAll = getUnixTimeNow()
  console.time("**** Run All Adaptor types")

  await Promise.all(ADAPTER_TYPES.map(runAdapterType))

  // const randomizedAdapterTypes = [...ADAPTER_TYPES].sort(() => Math.random() - 0.5)
  // for (const adapterType of randomizedAdapterTypes) {
  //   await runAdapterType(adapterType)
  // }

  async function runAdapterType(adapterType: AdapterType) {
    const startTimeCategory = getUnixTimeNow()
    // if (adapterType !== AdapterType.AGGREGATORS) return;
    const key = "**** Run Adaptor type: " + adapterType
    console.time(key)
    let success = false

    try {

      await handler2({ adapterType })

    } catch (e) {
      console.error("error", e)
      await elastic.addErrorLog({
        error: e as any,
        metadata: {
          application: "dimensions",
          type: 'category',
          name: adapterType,
        }
      })
    }

    console.timeEnd(key)
    const endTimeCategory = getUnixTimeNow()
    await elastic.addRuntimeLog({
      runtime: endTimeCategory - startTimeCategory,
      success,
      metadata: {
        application: "dimensions",
        isCategory: true,
        category: adapterType,
      }
    })

  }

  console.timeEnd("**** Run All Adaptor types")
  const endTimeAll = getUnixTimeNow()
  await elastic.addRuntimeLog({
    runtime: endTimeAll - startTimeAll,
    success: true,
    metadata: {
      application: "dimensions",
      type: 'all',
      name: 'all',
    }
  })
}

run().catch((e) => {
  console.error("Error in dimensions-store-all", e)
}).then(() => process.exit(0))

setTimeout(() => {
  console.error("Timeout reached, exiting from dimensions-store-all...")
  process.exit(1)
}, 1000 * 60 * 55) // 55 minutes


process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging, throwing an error, or other logic here
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
  // Application specific logging, throwing an error, or other logic here
  // process.exit(1); // Optional: exit the process after handling the exception
});