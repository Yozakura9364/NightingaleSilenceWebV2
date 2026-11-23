// 岛屿地图统一标记数据：动物（含刷新状态高亮）+ 可采集素材。
// 名称随当前语言解析；坐标为游戏内 0-42 刻度（TC 桥接）。
import { animalSpawnWindowState, currentEorzeaMinuteOfDay } from '@/lib/island/animals'
import { pickIslandName } from '@/lib/island/localization'
import type { IslandInteractiveMarker } from '@/pages/island/components/IslandInteractiveMap.vue'
import { loadIslandAnimals, loadIslandMaterials } from './islandApi'
import type { IslandUiLocale } from '@/lib/island/localization'

export interface IslandMapMarkerData {
  animals: IslandInteractiveMarker[]
  gathering: IslandInteractiveMarker[]
}

export async function loadIslandMapMarkers(locale: IslandUiLocale): Promise<IslandMapMarkerData> {
  const [animalsFile, materialsFile] = await Promise.all([loadIslandAnimals(), loadIslandMaterials()])
  const et = currentEorzeaMinuteOfDay(Date.now())

  const animals: IslandInteractiveMarker[] = animalsFile.animals
    .filter((animal) => animal.spawn && animal.name !== undefined)
    .map((animal) => {
      const active =
        animal.spawn?.spawnHour !== undefined && animal.spawn?.durationHours !== undefined
          ? animalSpawnWindowState(animal.spawn.spawnHour, animal.spawn.durationHours, et).active
          : false
      return {
        id: `a-${animal.id}`,
        kind: 'animal' as const,
        icon: animal.icon,
        name: pickIslandName(animal.names, locale) || animal.id,
        x: animal.spawn!.x,
        y: animal.spawn!.y,
        highlight: animal.rarity >= 3 || active
      }
    })

  const gathering: IslandInteractiveMarker[] = materialsFile.materials
    .filter((material) => material.gathering?.x != null && material.gathering?.y != null)
    .map((material) => ({
      id: `g-${material.id}`,
      kind: 'gather' as const,
      icon: material.icon,
      name: pickIslandName(material.names, locale) || material.id,
      x: material.gathering!.x!,
      y: material.gathering!.y!
    }))

  return { animals, gathering }
}
