<template>
  <main class="ns-page about-page">
    <div class="ns-page-shell about-page__shell ns-animate ns-animate--fade-in-up ns-animate-visible">
      <section class="about-section">
        <header class="about-section__header">
          <h1 class="ns-title">{{ t(textKeys.siteInfo) }}</h1>
        </header>
        <article class="ns-workbench-panel ns-workbench-panel--soft about-site-info">
          <dl>
            <div>
              <dt>{{ t(textKeys.siteName) }}</dt>
              <dd>{{ t(siteMeta.titleKey) }}</dd>
            </div>
            <div>
              <dt>{{ t(textKeys.siteUrl) }}</dt>
              <dd>
                <a :href="siteMeta.homepageUrl">{{ siteMeta.homepageUrl }}</a>
              </dd>
            </div>
            <div>
              <dt>{{ t(textKeys.siteIcon) }}</dt>
              <dd>
                <a :href="siteMeta.iconUrl">{{ siteMeta.iconUrl }}</a>
              </dd>
            </div>
          </dl>
        </article>
      </section>

      <section class="about-section">
        <header class="about-section__header">
          <h2 class="ns-title">{{ t(textKeys.profile) }}</h2>
        </header>

        <div class="ns-workbench-panel ns-workbench-panel--solid about-profile">
          <div class="about-profile__body">
            <figure class="about-profile__avatar-frame">
              <img
                class="about-profile__avatar"
                :src="profileAvatarSrc"
                :alt="t(textKeys.profile)"
                width="256"
                height="256"
                @error="useProfileAvatarFallback"
              />
            </figure>

            <section class="about-profile__sns" :aria-labelledby="snsHeadingId">
              <h3 :id="snsHeadingId" class="ns-heading-bloom">{{ t(textKeys.sns) }}</h3>
              <div class="about-profile__sns-list">
                <a
                  v-for="link in aboutSocialLinks"
                  :key="link.id"
                  class="about-profile__sns-link"
                  :href="link.href"
                  target="_blank"
                  rel="noopener noreferrer external"
                >
                  <img :src="link.icon" alt="" width="28" height="28" aria-hidden="true" />
                  <strong>{{ t(link.labelKey) }}</strong>
                  <span>{{ link.domain }}</span>
                  <span class="ns-sr-only">{{ t(textKeys.opensInNewTab) }}</span>
                </a>
              </div>
            </section>
          </div>
        </div>
      </section>

      <section class="about-section" :aria-labelledby="friendsHeadingId">
        <header class="about-section__header">
          <h2 :id="friendsHeadingId" class="ns-title">{{ t(textKeys.friends) }}</h2>
        </header>

        <div class="about-friends__grid">
          <a
            v-for="friend in friendLinks"
            :key="friend.id"
            class="about-friend-link"
            :href="friend.href"
            target="_blank"
            rel="noopener noreferrer external"
          >
            <span class="about-friend-link__icon" aria-hidden="true">
              <img
                :src="friend.icon"
                alt=""
                width="48"
                height="48"
                loading="lazy"
                decoding="async"
                referrerpolicy="no-referrer"
                @error="useFriendIconFallback"
              />
            </span>
            <span class="about-friend-link__copy">
              <strong>{{ t(friend.labelKey) }}</strong>
              <small>{{ friend.description }}</small>
            </span>
          </a>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import pixelAvatarCircleIcon from '@/assets/icons/pixelarticons/avatar-circle.svg'
import pixelHomeIcon from '@/assets/icons/pixelarticons/home.svg'
import { siteMeta } from '@/config/site'
import { siteSocialLinks, type SiteSocialLinkId } from '@/config/socialLinks'
import { aboutTextKeys as textKeys } from '@/locales/keys/about'
import { useLocale } from '@/stores/locale'

const { t } = useLocale()
const snsHeadingId = 'about-sns-heading'
const friendsHeadingId = 'about-friends-heading'
const localAssetBase = import.meta.env.VITE_LOCAL_ASSET_BASE ?? '/local-assets'
const profileAvatarSrc = ref(
  import.meta.env.DEV ? `${localAssetBase}/yoine-avatar.webp` : pixelAvatarCircleIcon
)

const socialLabelKeys: Record<SiteSocialLinkId, string> = {
  huiji: textKeys.socialHuiji,
  nga: textKeys.socialNga,
  xiaohongshu: textKeys.socialXiaohongshu,
  weibo: textKeys.socialWeibo,
  douyin: textKeys.socialDouyin
}

const aboutSocialLinks = siteSocialLinks.map((link) => ({
  ...link,
  labelKey: socialLabelKeys[link.id]
}))

const friendLinks = [
  {
    id: 'flowersink',
    labelKey: textKeys.friendFlowersink,
    href: 'https://flowersink.com/',
    description: '好耶！是再花猫猫头ฅ•ω•ฅ',
    icon: 'https://api.flowersink.com/img/logo.png'
  }
] as const

function useProfileAvatarFallback() {
  profileAvatarSrc.value = pixelAvatarCircleIcon
}

function useFriendIconFallback(event: Event) {
  const image = event.currentTarget
  if (image instanceof HTMLImageElement && image.dataset.fallbackApplied !== 'true') {
    image.dataset.fallbackApplied = 'true'
    image.src = pixelHomeIcon
  }
}
</script>

<style scoped>
.about-page {
  min-height: calc(100vh - 58px);
  background: var(--ns-body-background);
}

.about-page__shell {
  display: grid;
  width: min(1120px, calc(100vw - 32px));
  gap: 28px;
  padding-top: 24px;
  padding-bottom: 64px;
}

.about-profile__sns-link:focus-visible,
.about-site-info a:focus-visible,
.about-friend-link:focus-visible {
  outline: 0;
  box-shadow: var(--ns-focus-ring);
}

.about-profile {
  padding: 0;
}

.about-profile__body {
  display: grid;
  grid-template-columns: minmax(180px, 256px) minmax(0, 1fr);
  align-items: stretch;
  gap: 28px;
  padding: 24px;
}

.about-profile__avatar-frame {
  display: grid;
  aspect-ratio: 1;
  width: 100%;
  margin: 0;
  overflow: hidden;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-pixel-window-bg);
  box-shadow: 4px 4px 0 var(--ns-pixel-shadow-color);
}

.about-profile__avatar {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  image-rendering: pixelated;
}

.about-profile__sns {
  display: grid;
  align-content: start;
  gap: 14px;
  min-width: 0;
}

.about-profile__sns h3 {
  margin: 0;
  font-family: var(--ns-font-decorative);
  font-size: 18px;
  letter-spacing: 0;
}

.about-profile__sns-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.about-profile__sns-link {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr);
  grid-template-rows: auto auto;
  align-items: center;
  gap: 2px 10px;
  min-width: 0;
  min-height: 62px;
  padding: 9px 11px;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-pixel-surface);
  box-shadow: 3px 3px 0 var(--ns-pixel-shadow-color);
  color: var(--ns-color-text);
  text-decoration: none;
  transition:
    transform 0.2s ease,
    background 0.2s ease,
    box-shadow 0.2s ease;
}

.about-profile__sns-link:hover {
  transform: translate(-1px, -1px);
  background: var(--ns-pixel-hover-surface);
  box-shadow: 4px 4px 0 var(--ns-pixel-shadow-color);
}

.about-profile__sns-link:active {
  transform: translate(2px, 2px);
  box-shadow: none;
}

.about-profile__sns-link img {
  grid-row: 1 / span 2;
  display: block;
  width: 28px;
  height: 28px;
  object-fit: contain;
  filter: none;
}

.about-profile__sns-link strong,
.about-profile__sns-link span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.about-profile__sns-link strong {
  align-self: end;
  font-family: var(--ns-font-decorative);
  font-size: 13px;
}

.about-profile__sns-link span {
  align-self: start;
  color: var(--ns-color-text-muted);
  font-size: 11px;
}

.about-section {
  display: grid;
  gap: 16px;
}

.about-section__header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  border-bottom: 2px solid var(--ns-pixel-border);
  padding-bottom: 10px;
}

.about-section__header .ns-title {
  margin: 0;
  font-size: 28px;
}

.about-site-info {
  padding: 0;
}

.about-site-info dl {
  display: grid;
  gap: 0;
  margin: 0;
}

.about-site-info dl > div {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 12px;
  padding: 12px 14px;
  border-top: 1px solid var(--ns-pixel-border-soft);
}

.about-site-info dl > div:first-child {
  border-top: 0;
}

.about-site-info dt,
.about-site-info dd,
.about-site-info a {
  min-width: 0;
  margin: 0;
  font-family: var(--ns-font-decorative);
  letter-spacing: 0;
}

.about-site-info dt {
  color: var(--ns-color-text-muted);
  font-family: var(--ns-font-decorative);
  font-size: 12px;
  font-weight: 900;
}

.about-site-info dd,
.about-site-info a {
  overflow-wrap: anywhere;
  color: var(--ns-color-text);
  font-size: 13px;
  font-weight: 950;
}

.about-friends__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.about-friend-link {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  min-height: 76px;
  padding: 12px;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-pixel-surface);
  box-shadow: var(--ns-pixel-soft-shadow);
  color: var(--ns-color-text);
  text-decoration: none;
  transition:
    transform 0.2s ease,
    background 0.2s ease,
    box-shadow 0.2s ease;
}

.about-friend-link:hover {
  transform: translate(-2px, -2px);
  background: var(--ns-pixel-hover-surface);
  box-shadow: var(--ns-pixel-shadow);
}

.about-friend-link:active {
  transform: translate(2px, 2px);
  box-shadow: none;
}

.about-friend-link__icon {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  overflow: hidden;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-pixel-window-bg);
}

.about-friend-link__icon img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.about-friend-link__copy {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.about-friend-link__copy strong {
  font-family: var(--ns-font-decorative);
  font-size: 14px;
}

.about-friend-link__copy small {
  overflow: hidden;
  color: var(--ns-color-text-muted);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 820px) {
  .about-profile__body {
    grid-template-columns: 180px minmax(0, 1fr);
    gap: 20px;
  }

  .about-profile__sns-list,
  .about-friends__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 620px) {
  .about-page__shell {
    width: min(100%, calc(100vw - 24px));
    gap: 22px;
    padding-top: 18px;
  }

  .about-profile__body {
    grid-template-columns: 1fr;
  }

  .about-profile__body {
    padding: 16px;
  }

  .about-profile__avatar-frame {
    width: min(100%, 220px);
    justify-self: center;
  }

  .about-profile__sns-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .about-profile__sns-link {
    grid-template-columns: 28px minmax(0, 1fr);
    gap: 2px 8px;
    min-height: 56px;
    padding: 8px;
  }

  .about-profile__sns-link img {
    width: 24px;
    height: 24px;
  }
}

@media (max-width: 420px) {
  .about-profile__sns-list,
  .about-friends__grid {
    grid-template-columns: 1fr;
  }
}
</style>
