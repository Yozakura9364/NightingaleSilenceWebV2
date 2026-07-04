import { siteRoutes, textKeys } from '@/config/site'
import { getSilenceCharacterRoute, getSilenceCharactersByGroup } from '@/data/silence/characters'

export interface SilenceTurnNode {
  id: string
  route: string
  labelKey?: string
  name?: string
}

export interface SilenceTurnNeighbors {
  left?: SilenceTurnNode
  current?: SilenceTurnNode
  right?: SilenceTurnNode
}

export function getSilenceTurnNodeLabel(
  node: SilenceTurnNode | undefined,
  translate: (key: string) => string
): string | undefined {
  if (!node) {
    return undefined
  }

  return node.name ?? (node.labelKey ? translate(node.labelKey) : undefined)
}

export function getSilenceTurnNodes(): SilenceTurnNode[] {
  const angelCharacters = getSilenceCharactersByGroup('angel').map((character) => ({
    id: character.id,
    route: getSilenceCharacterRoute(character),
    name: character.name
  }))

  return [
    ...angelCharacters,
    {
      id: 'angel',
      route: siteRoutes.silenceAngel,
      labelKey: textKeys.silenceAngel
    },
    {
      id: 'silence',
      route: siteRoutes.silence,
      labelKey: textKeys.silence
    },
    {
      id: 'glitch',
      route: siteRoutes.silenceGlitch,
      labelKey: textKeys.silenceGlitch
    }
  ]
}

export function getSilenceTurnNeighbors(path: string): SilenceTurnNeighbors {
  const nodes = getSilenceTurnNodes()
  const currentIndex = nodes.findIndex((node) => node.route === path)

  if (currentIndex < 0) {
    return {}
  }

  return {
    left: nodes[currentIndex - 1],
    current: nodes[currentIndex],
    right: nodes[currentIndex + 1]
  }
}
