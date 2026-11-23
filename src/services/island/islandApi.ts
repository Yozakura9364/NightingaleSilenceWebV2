// 无人岛数据 service：页面只依赖本服务，不直接 useFetch。
// 数据文件由 scripts/build-island-catalog.mjs 生成到 public/data/ffxiv/island/。
import { useFetch } from '@/composables/useFetch'
import { resolvePublicDataPath } from '@/services/dataAccess'
import type {
  IslandAchievementsFile,
  IslandAnimalsFile,
  IslandBuildingsFile,
  IslandCropsFile,
  IslandGranaryFile,
  IslandMaterialsFile,
  IslandRanksFile,
  IslandRewardsFile,
  IslandShopFile,
  IslandWeeklyFile,
  IslandWorkshopFile
} from '@/lib/island/types'

export type IslandDataFileName =
  | 'materials'
  | 'workshop'
  | 'weekly'
  | 'animals'
  | 'crops'
  | 'buildings'
  | 'ranks'
  | 'shop'
  | 'rewards'
  | 'achievements'
  | 'granary'

export async function loadIslandFile<T>(file: IslandDataFileName, signal?: AbortSignal): Promise<T> {
  const { api } = useFetch()
  return api<T>(resolvePublicDataPath(`ffxiv/island/${file}.json`), { signal })
}

export function loadIslandMaterials(signal?: AbortSignal) {
  return loadIslandFile<IslandMaterialsFile>('materials', signal)
}

export function loadIslandWorkshop(signal?: AbortSignal) {
  return loadIslandFile<IslandWorkshopFile>('workshop', signal)
}

export function loadIslandWeekly(signal?: AbortSignal) {
  return loadIslandFile<IslandWeeklyFile>('weekly', signal)
}

export function loadIslandAnimals(signal?: AbortSignal) {
  return loadIslandFile<IslandAnimalsFile>('animals', signal)
}

export function loadIslandCrops(signal?: AbortSignal) {
  return loadIslandFile<IslandCropsFile>('crops', signal)
}

export function loadIslandBuildings(signal?: AbortSignal) {
  return loadIslandFile<IslandBuildingsFile>('buildings', signal)
}

export function loadIslandRanks(signal?: AbortSignal) {
  return loadIslandFile<IslandRanksFile>('ranks', signal)
}

export function loadIslandShop(signal?: AbortSignal) {
  return loadIslandFile<IslandShopFile>('shop', signal)
}

export function loadIslandRewards(signal?: AbortSignal) {
  return loadIslandFile<IslandRewardsFile>('rewards', signal)
}

export function loadIslandAchievements(signal?: AbortSignal) {
  return loadIslandFile<IslandAchievementsFile>('achievements', signal)
}

export function loadIslandGranary(signal?: AbortSignal) {
  return loadIslandFile<IslandGranaryFile>('granary', signal)
}
