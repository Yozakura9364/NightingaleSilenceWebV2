<template>
  <main class="style-lab-page" :style="styleLabLocalArtStyle">
    <section class="style-formal-sample" :aria-label="t(textKeys.styleLabFormalComponents)">
      <div class="style-formal-sample__shell">
        <AppPixelWindow :title="t(textKeys.styleLabFormalComponents)" :closable="false">
          <div class="style-formal-sample__content">
            <AppToolbar
              :title="t(textKeys.styleLabFormalControls)"
              :aria-label="t(textKeys.styleLabFormalControls)"
            >
              <AppButton variant="primary">{{ t(textKeys.import) }}</AppButton>
              <AppButton variant="secondary">{{ t(textKeys.export) }}</AppButton>
              <AppButton>{{ t(textKeys.saveDraft) }}</AppButton>

              <template #end>
                <AppStatus compact tone="success" :message="t(textKeys.styleLabReady)" />
              </template>
            </AppToolbar>

            <div
              class="style-formal-sample__button-row"
              :aria-label="t(textKeys.styleLabFormalControls)"
            >
              <AppButton variant="ghost" size="compact">{{ t(textKeys.details) }}</AppButton>
              <AppButton variant="danger" size="compact">{{ t(textKeys.placeholder) }}</AppButton>
              <AppButton size="compact" disabled>{{ t(textKeys.placeholder) }}</AppButton>
              <AppButton size="icon" :aria-label="t(textKeys.details)">?</AppButton>
            </div>

            <AppTabs
              v-model="formalTab"
              :items="formalTabs"
              :aria-label="t(textKeys.styleLabCommonTabsPreview)"
              stretch
            />

            <div class="style-formal-sample__grid">
              <AppField
                :label="t(textKeys.styleLabTitleField)"
                for-id="style-lab-formal-title"
                :description="t(textKeys.placeholder)"
              >
                <input id="style-lab-formal-title" type="text" :value="t(textKeys.placeholder)" />
              </AppField>

              <AppField :label="t(textKeys.styleLabLanguage)" for-id="style-lab-formal-locale">
                <select id="style-lab-formal-locale">
                  <option v-for="option in siteLocaleOptions" :key="option.locale">
                    {{ t(option.labelKey) }}
                  </option>
                </select>
              </AppField>
            </div>

            <div class="style-formal-sample__states" :aria-label="t(textKeys.styleLabFormalStates)">
              <AppStatus
                tone="info"
                :title="t(textKeys.styleLabAppStatus)"
                :message="t(textKeys.placeholder)"
              />
              <AppStatus
                tone="warning"
                :title="t(textKeys.styleLabFormalStates)"
                :message="t(textKeys.placeholder)"
              />
              <AppStatus
                tone="loading"
                :title="t(textKeys.checking)"
                :message="t(textKeys.placeholder)"
              />
              <AppStatus
                tone="danger"
                :title="t(textKeys.status)"
                :message="t(textKeys.placeholder)"
              />
            </div>

            <div class="style-formal-sample__loading" :aria-label="t(textKeys.checking)">
              <AppLoading
                :title="t(textKeys.checking)"
                :message="t(textKeys.placeholder)"
                size="md"
              />
              <AppLoading compact :message="t(textKeys.placeholder)" />
              <div class="style-formal-sample__loading-action">
                <AppButton variant="primary" @click="showStyleLabLoadingPreview">
                  {{ t(textKeys.styleLabLoadingPreviewAction) }}
                </AppButton>
                <AppStatus
                  compact
                  tone="info"
                  :message="t(textKeys.styleLabLoadingPreviewMessage)"
                />
              </div>
            </div>
          </div>
        </AppPixelWindow>
      </div>
    </section>

    <section
      class="style-lab-experiment"
      data-style-preview="pixel-soft"
      :data-font-mode="fontMode"
      :data-pixel-tone="effectivePixelTone"
    >
      <div class="ns-pixel-stage">
        <div class="ns-pixel-shell">
          <div class="ns-pixel-switch-row">
            <div class="ns-pixel-mode-switch" :aria-label="t(textKeys.styleLabPixelTone)">
              <button
                v-for="option in pixelToneOptions"
                :key="option.value"
                class="ns-pixel-mode-button"
                :class="{ 'ns-pixel-mode-button--active': effectivePixelTone === option.value }"
                type="button"
                @click="setPixelTone(option.value)"
              >
                {{ t(option.labelKey) }}
              </button>
            </div>

            <div class="ns-pixel-mode-switch" :aria-label="t(textKeys.styleLabFontMode)">
              <button
                v-for="option in fontModeOptions"
                :key="option.value"
                class="ns-pixel-mode-button"
                :class="{ 'ns-pixel-mode-button--active': fontMode === option.value }"
                type="button"
                @click="fontMode = option.value"
              >
                {{ t(option.labelKey) }}
              </button>
            </div>
          </div>

          <section class="ns-pixel-hero">
            <div class="ns-pixel-panel">
              <h1 class="ns-pixel-title">{{ t(textKeys.styleLabTitle) }}</h1>
              <p class="ns-pixel-lead">
                {{ t(textKeys.styleLabSampleLead) }}
              </p>

              <div class="ns-pixel-actions">
                <button class="ns-pixel-button ns-pixel-button--primary" type="button">
                  {{ t(textKeys.styleLabPrimary) }}
                </button>
                <button class="ns-pixel-button ns-pixel-button--blue" type="button">
                  {{ t(textKeys.styleLabAction) }}
                </button>
                <button class="ns-pixel-button" type="button">
                  {{ t(textKeys.styleLabDefault) }}
                </button>
              </div>
            </div>

            <aside class="ns-pixel-window" :aria-label="t(textKeys.styleLabWindowSample)">
              <div class="ns-pixel-window__bar">
                <span class="ns-pixel-window__title">
                  <span class="ns-pixel-window__icon" aria-hidden="true"></span>
                  {{ t(textKeys.styleLabWindowSample) }}
                </span>
                <span class="ns-pixel-window__controls" aria-hidden="true">
                  <span class="ns-pixel-window__control ns-pixel-window__control--min"></span>
                  <span class="ns-pixel-window__control ns-pixel-window__control--max"></span>
                  <span class="ns-pixel-window__control ns-pixel-window__control--close"></span>
                </span>
              </div>

              <div class="ns-pixel-cluster">
                <span class="ns-pixel-badge ns-pixel-badge--pink">{{
                  t(textKeys.placeholder)
                }}</span>
                <span class="ns-pixel-badge">{{ t(textKeys.placeholder) }}</span>
                <span class="ns-pixel-badge ns-pixel-badge--green">{{
                  t(textKeys.styleLabReady)
                }}</span>
              </div>

              <div class="ns-pixel-swatch-row" :aria-label="t(textKeys.styleLabPalette)">
                <span class="ns-pixel-swatch ns-pixel-swatch--pink"></span>
                <span class="ns-pixel-swatch ns-pixel-swatch--blue"></span>
                <span class="ns-pixel-swatch ns-pixel-swatch--yellow"></span>
                <span class="ns-pixel-swatch ns-pixel-swatch--green"></span>
              </div>

              <div class="ns-pixel-meter" :aria-label="t(textKeys.styleLabProgress)">
                <div class="ns-pixel-meter__bar"></div>
              </div>
            </aside>
          </section>

          <section class="ns-pixel-menu-lab" :aria-label="t(textKeys.styleLabPopupMenuSample)">
            <div class="ns-pixel-menu-stage">
              <div class="ns-pixel-menu-stage__topbar">
                <span>{{ t(textKeys.siteEnName) }}</span>
                <button class="ns-pixel-menu-trigger" type="button">
                  {{ t(textKeys.menuTitle) }}
                </button>
              </div>

              <aside
                class="ns-pixel-window ns-pixel-menu-popup ns-pixel-menu-popup--animated-icons"
                :aria-label="t(textKeys.styleLabPopupWindowSample)"
              >
                <div class="ns-pixel-window__bar">
                  <span class="ns-pixel-window__title">
                    <span class="ns-pixel-window__icon" aria-hidden="true"></span>
                    {{ t(textKeys.menuTitle) }}
                  </span>
                  <span class="ns-pixel-window__controls" aria-hidden="true">
                    <span class="ns-pixel-window__control ns-pixel-window__control--min"></span>
                    <span class="ns-pixel-window__control ns-pixel-window__control--max"></span>
                    <span class="ns-pixel-window__control ns-pixel-window__control--close"></span>
                  </span>
                </div>

                <nav
                  class="ns-pixel-popup-menu"
                  :aria-label="t(textKeys.styleLabPopupNavigationSample)"
                >
                  <a class="ns-pixel-popup-menu__item ns-pixel-popup-menu__item--home" href="#/">
                    <span class="ns-pixel-popup-menu__item-main">
                      <span
                        class="ns-pixel-icon"
                        :style="pixelIconStyle(pixelHomeIcon)"
                        aria-hidden="true"
                      ></span>
                      <span>{{ t(textKeys.home) }}</span>
                    </span>
                    <span class="ns-pixel-popup-menu__item-command">
                      {{ t(textKeys.homeCommand) }}
                    </span>
                  </a>

                  <button
                    class="ns-pixel-popup-menu__item"
                    :class="{
                      'ns-pixel-popup-menu__item--active': styleLabPopupSection === 'ffxiv',
                      'ns-pixel-popup-menu__item--expanded': styleLabPopupSection === 'ffxiv'
                    }"
                    type="button"
                    @click="toggleStyleLabPopupSection('ffxiv')"
                  >
                    <span class="ns-pixel-popup-menu__item-main">
                      <span
                        class="ns-pixel-icon"
                        :style="pixelIconStyle(pixelFolderIcon)"
                        aria-hidden="true"
                      ></span>
                      <span>{{ t(textKeys.ffxivWorkshop) }}</span>
                    </span>
                    <span class="ns-pixel-popup-menu__item-command">FFXIV TOOLS</span>
                  </button>

                  <div
                    v-if="styleLabPopupSection === 'ffxiv'"
                    class="ns-pixel-popup-menu__children"
                    :aria-label="t(textKeys.styleLabFfxivChildren)"
                  >
                    <a href="#/ffxiv/glamour">
                      <span class="ns-pixel-popup-menu__child-main">
                        <span
                          class="ns-pixel-popup-menu__child-icon ns-pixel-icon"
                          :style="pixelIconStyle(pixelSparklesIcon)"
                          aria-hidden="true"
                        ></span>
                        <span>{{ t(textKeys.glamourTitle) }}</span>
                      </span>
                    </a>
                    <a href="#/ffxiv/plate">
                      <span class="ns-pixel-popup-menu__child-main">
                        <span
                          class="ns-pixel-popup-menu__child-icon ns-pixel-icon"
                          :style="pixelIconStyle(pixelAvatarCircleIcon)"
                          aria-hidden="true"
                        ></span>
                        <span>{{ t(textKeys.plateTitle) }}</span>
                      </span>
                    </a>
                    <a href="#/ffxiv/armoire">
                      <span class="ns-pixel-popup-menu__child-main">
                        <span
                          class="ns-pixel-popup-menu__child-icon ns-pixel-icon"
                          :style="pixelIconStyle(pixelPlaceholderMenuIcon)"
                          aria-hidden="true"
                        ></span>
                        <span>{{ t(textKeys.armoireTitle) }}</span>
                      </span>
                    </a>
                  </div>

                  <button
                    class="ns-pixel-popup-menu__item"
                    :class="{
                      'ns-pixel-popup-menu__item--active': styleLabPopupSection === 'silence',
                      'ns-pixel-popup-menu__item--expanded': styleLabPopupSection === 'silence'
                    }"
                    type="button"
                    @click="toggleStyleLabPopupSection('silence')"
                  >
                    <span class="ns-pixel-popup-menu__item-main">
                      <span
                        class="ns-pixel-icon"
                        :style="pixelIconStyle(pixelImageIcon)"
                        aria-hidden="true"
                      ></span>
                      <span>{{ t(textKeys.silence) }}</span>
                    </span>
                    <span class="ns-pixel-popup-menu__item-command">YOINE</span>
                  </button>

                  <div
                    v-if="styleLabPopupSection === 'silence'"
                    class="ns-pixel-popup-menu__children"
                    :aria-label="t(textKeys.styleLabOcChildren)"
                  >
                    <a href="#/silence/angel">
                      <span class="ns-pixel-popup-menu__child-main">
                        <span
                          class="ns-pixel-popup-menu__child-icon ns-pixel-icon"
                          :style="pixelIconStyle(pixelPlaceholderMenuIcon)"
                          aria-hidden="true"
                        ></span>
                        <span>{{ t(textKeys.silenceAngel) }}</span>
                      </span>
                    </a>
                    <a href="#/silence/glitch">
                      <span class="ns-pixel-popup-menu__child-main">
                        <span
                          class="ns-pixel-popup-menu__child-icon ns-pixel-icon"
                          :style="pixelIconStyle(pixelPlaceholderMenuIcon)"
                          aria-hidden="true"
                        ></span>
                        <span>{{ t(textKeys.silenceGlitch) }}</span>
                      </span>
                    </a>
                  </div>

                  <a class="ns-pixel-popup-menu__item" href="#/about">
                    <span class="ns-pixel-popup-menu__item-main">
                      <span
                        class="ns-pixel-icon"
                        :style="pixelIconStyle(pixelStarIcon)"
                        aria-hidden="true"
                      ></span>
                      <span>{{ t(textKeys.about) }}</span>
                    </span>
                    <span class="ns-pixel-popup-menu__item-command">
                      {{ t(textKeys.aboutCommand) }}
                    </span>
                  </a>
                </nav>
              </aside>
            </div>
          </section>

          <section
            class="ns-pixel-window ns-pixel-icon-lab"
            :aria-label="t(textKeys.styleLabIconLab)"
          >
            <div class="ns-pixel-window__bar">
              <span class="ns-pixel-window__title">
                <span class="ns-pixel-window__icon" aria-hidden="true"></span>
                {{ t(textKeys.styleLabIconLab) }}
              </span>
              <span class="ns-pixel-window__controls" aria-hidden="true">
                <span class="ns-pixel-window__control ns-pixel-window__control--min"></span>
                <span class="ns-pixel-window__control ns-pixel-window__control--max"></span>
                <span class="ns-pixel-window__control ns-pixel-window__control--close"></span>
              </span>
            </div>

            <nav class="ns-pixel-icon-text-bar" :aria-label="t(textKeys.styleLabIconTextBar)">
              <a
                class="ns-pixel-icon-text-bar__brand"
                href="#/"
                :aria-label="t(textKeys.home)"
                :title="t(textKeys.home)"
              >
                <span
                  class="ns-pixel-icon"
                  :style="pixelIconStyle(pixelHomeIcon)"
                  aria-hidden="true"
                ></span>
                <span class="ns-pixel-icon-text-bar__label">{{ t(textKeys.siteEnName) }}</span>
                <span class="ns-pixel-icon-text-bar__command">{{ t(textKeys.homeCommand) }}</span>
              </a>

              <div class="ns-pixel-icon-text-bar__actions">
                <button
                  v-for="action in pixelIconBarActions"
                  :key="action.id"
                  class="ns-pixel-icon-text-bar__button"
                  :class="{
                    'ns-pixel-icon-text-bar__button--active': action.active,
                    'ns-pixel-icon-text-bar__button--pink': action.variant === 'pink',
                    'ns-pixel-icon-text-bar__button--blue': action.variant === 'blue'
                  }"
                  :aria-label="t(action.labelKey)"
                  :title="t(action.labelKey)"
                  type="button"
                >
                  <span
                    class="ns-pixel-icon"
                    :style="pixelIconStyle(action.icon)"
                    aria-hidden="true"
                  ></span>
                  <span class="ns-pixel-icon-text-bar__label">{{ t(action.labelKey) }}</span>
                  <span v-if="action.commandKey" class="ns-pixel-icon-text-bar__command">
                    {{ t(action.commandKey) }}
                  </span>
                </button>
              </div>
            </nav>

            <div class="ns-pixel-icon-lab__grid">
              <section class="ns-pixel-icon-lab__panel">
                <h2 class="ns-pixel-workbench__panel-title">
                  {{ t(textKeys.styleLabIconOnlyButtons) }}
                </h2>
                <div
                  class="ns-pixel-icon-lab__button-row"
                  :aria-label="t(textKeys.styleLabIconOnlyButtons)"
                >
                  <button
                    v-for="action in pixelIconButtons"
                    :key="action.id"
                    class="ns-pixel-icon-button"
                    :class="`ns-pixel-icon-button--${action.variant ?? 'plain'}`"
                    type="button"
                    :aria-label="t(action.labelKey)"
                    :title="t(action.labelKey)"
                  >
                    <span
                      class="ns-pixel-icon"
                      :style="pixelIconStyle(action.icon)"
                      aria-hidden="true"
                    ></span>
                  </button>
                </div>
              </section>

              <section class="ns-pixel-icon-lab__panel">
                <h2 class="ns-pixel-workbench__panel-title">
                  {{ t(textKeys.styleLabTextIconButtons) }}
                </h2>
                <div
                  class="ns-pixel-icon-lab__text-button-row"
                  :aria-label="t(textKeys.styleLabTextIconButtons)"
                >
                  <button
                    v-for="action in pixelTextIconButtons"
                    :key="action.id"
                    class="ns-pixel-button"
                    :class="{
                      'ns-pixel-button--primary': action.variant === 'pink',
                      'ns-pixel-button--blue': action.variant === 'blue'
                    }"
                    type="button"
                  >
                    <span
                      class="ns-pixel-icon"
                      :style="pixelIconStyle(action.icon)"
                      aria-hidden="true"
                    ></span>
                    <span>{{ t(action.labelKey) }}</span>
                  </button>
                </div>
              </section>

              <nav
                class="ns-pixel-icon-lab__panel ns-pixel-icon-menu"
                :aria-label="t(textKeys.styleLabIconMenuSample)"
              >
                <h2 class="ns-pixel-workbench__panel-title">
                  {{ t(textKeys.styleLabIconMenuSample) }}
                </h2>
                <template v-for="item in pixelIconMenuItems" :key="item.id">
                  <button
                    v-if="item.children"
                    class="ns-pixel-icon-menu__item"
                    :class="{
                      'ns-pixel-icon-menu__item--active': styleLabIconMenuSection === item.section
                    }"
                    type="button"
                    :aria-expanded="styleLabIconMenuSection === item.section"
                    @click="setStyleLabIconMenuSection(item.section)"
                  >
                    <span class="ns-pixel-icon-menu__main">
                      <span
                        class="ns-pixel-icon"
                        :style="pixelIconStyle(item.icon)"
                        aria-hidden="true"
                      ></span>
                      <span>{{ t(item.labelKey) }}</span>
                    </span>
                    <span>{{ t(item.commandKey) }}</span>
                  </button>

                  <a
                    v-else
                    class="ns-pixel-icon-menu__item"
                    :class="{ 'ns-pixel-icon-menu__item--active': item.active }"
                    :href="item.href"
                  >
                    <span class="ns-pixel-icon-menu__main">
                      <span
                        class="ns-pixel-icon"
                        :style="pixelIconStyle(item.icon)"
                        aria-hidden="true"
                      ></span>
                      <span>{{ t(item.labelKey) }}</span>
                    </span>
                    <span>{{ t(item.commandKey) }}</span>
                  </a>

                  <div
                    v-if="item.children && styleLabIconMenuSection === item.section"
                    class="ns-pixel-icon-menu__children"
                    :aria-label="t(textKeys.styleLabFfxivChildren)"
                  >
                    <a
                      v-for="child in item.children"
                      :key="child.id"
                      class="ns-pixel-icon-menu__child"
                      :href="child.href"
                    >
                      <span class="ns-pixel-icon-menu__child-main">
                        <span
                          class="ns-pixel-icon-menu__child-icon ns-pixel-icon"
                          :style="pixelIconStyle(child.icon)"
                          aria-hidden="true"
                        ></span>
                        <span>{{ t(child.labelKey) }}</span>
                      </span>
                    </a>
                  </div>
                </template>
              </nav>
            </div>

            <div class="ns-pixel-icon-lab__source">
              <span class="ns-pixel-badge ns-pixel-badge--green">
                {{ t(textKeys.styleLabIconSource) }}
              </span>
            </div>
          </section>

          <section
            class="ns-pixel-window ns-pixel-desktop-lab"
            :aria-label="t(textKeys.home)"
          >
            <div class="ns-pixel-window__bar">
              <span class="ns-pixel-window__title">
                <span class="ns-pixel-window__icon" aria-hidden="true"></span>
                {{ t(textKeys.home) }} / {{ t(textKeys.styleLabSkinName) }}
              </span>
              <span class="ns-pixel-window__controls" aria-hidden="true">
                <span class="ns-pixel-window__control ns-pixel-window__control--min"></span>
                <span class="ns-pixel-window__control ns-pixel-window__control--max"></span>
                <span class="ns-pixel-window__control ns-pixel-window__control--close"></span>
              </span>
            </div>

            <div class="ns-pixel-desktop-preview">
              <div class="ns-pixel-desktop-preview__grid" aria-hidden="true"></div>

              <nav class="ns-pixel-desktop-icons" :aria-label="t(textKeys.menuTitle)">
                <a
                  v-for="item in pixelDesktopIcons"
                  :key="item.id"
                  class="ns-pixel-desktop-icon"
                  :href="item.href"
                >
                  <span
                    class="ns-pixel-desktop-icon__image ns-pixel-icon"
                    :style="pixelIconStyle(item.icon)"
                    aria-hidden="true"
                  ></span>
                  <span class="ns-pixel-desktop-icon__label">{{ t(item.labelKey) }}</span>
                </a>
              </nav>

              <article
                class="ns-pixel-desktop-window ns-pixel-desktop-window--main"
                :aria-label="t(textKeys.siteEnName)"
              >
                <div class="ns-pixel-desktop-window__bar">
                  <span
                    class="ns-pixel-icon"
                    :style="pixelIconStyle(pixelHomeIcon)"
                    aria-hidden="true"
                  ></span>
                  <span>{{ t(textKeys.siteEnName) }}</span>
                  <span class="ns-pixel-desktop-window__controls" aria-hidden="true">
                    <span></span>
                    <span></span>
                    <span></span>
                  </span>
                </div>
                <div class="ns-pixel-desktop-window__body ns-pixel-desktop-window__body--main">
                  <div class="ns-pixel-desktop-portrait" aria-hidden="true">
                    <span></span>
                  </div>
                  <div class="ns-pixel-desktop-copy">
                    <h2>{{ t(textKeys.siteZhName) }}</h2>
                    <p>{{ t(textKeys.placeholder) }}</p>
                    <div class="ns-pixel-desktop-copy__actions">
                      <a class="ns-pixel-button ns-pixel-button--primary" href="#/ffxiv">
                        {{ t(textKeys.ffxivWorkshop) }}
                      </a>
                      <a class="ns-pixel-button" href="#/silence">
                        {{ t(textKeys.silence) }}
                      </a>
                    </div>
                  </div>
                </div>
              </article>

              <aside
                class="ns-pixel-desktop-window ns-pixel-desktop-window--tools"
                :aria-label="t(textKeys.ffxivWorkshop)"
              >
                <div class="ns-pixel-desktop-window__bar ns-pixel-desktop-window__bar--blue">
                  <span
                    class="ns-pixel-icon"
                    :style="pixelIconStyle(pixelFolderIcon)"
                    aria-hidden="true"
                  ></span>
                  <span>{{ t(textKeys.ffxivWorkshop) }}</span>
                  <span class="ns-pixel-desktop-window__controls" aria-hidden="true">
                    <span></span>
                    <span></span>
                  </span>
                </div>
                <div class="ns-pixel-desktop-window__body">
                  <a
                    v-for="item in pixelDesktopTools"
                    :key="item.id"
                    class="ns-pixel-desktop-tool"
                    :href="item.href"
                  >
                    <span
                      class="ns-pixel-icon"
                      :style="pixelIconStyle(item.icon)"
                      aria-hidden="true"
                    ></span>
                    <span>{{ t(item.labelKey) }}</span>
                  </a>
                </div>
              </aside>

              <aside
                class="ns-pixel-desktop-window ns-pixel-desktop-window--status"
                :aria-label="t(textKeys.status)"
              >
                <div class="ns-pixel-desktop-window__bar ns-pixel-desktop-window__bar--pink">
                  <span
                    class="ns-pixel-icon"
                    :style="pixelIconStyle(pixelStarIcon)"
                    aria-hidden="true"
                  ></span>
                  <span>{{ t(textKeys.status) }}</span>
                  <span class="ns-pixel-desktop-window__controls" aria-hidden="true">
                    <span></span>
                  </span>
                </div>
                <div class="ns-pixel-desktop-window__body">
                  <div class="ns-pixel-desktop-status-row">
                    <span>{{ t(textKeys.styleLabReady) }}</span>
                    <strong>{{ t(textKeys.statusOpen) }}</strong>
                  </div>
                  <div class="ns-pixel-desktop-meter" aria-hidden="true">
                    <span style="--desktop-meter: 74%"></span>
                  </div>
                  <div class="ns-pixel-desktop-status-row">
                    <span>{{ t(textKeys.styleLabWorkbenchMeters) }}</span>
                    <strong>{{ t(textKeys.placeholder) }}</strong>
                  </div>
                </div>
              </aside>

              <aside
                class="ns-pixel-desktop-window ns-pixel-desktop-window--note"
                :aria-label="t(textKeys.styleLabNotebookCard)"
              >
                <div class="ns-pixel-desktop-window__bar">
                  <span
                    class="ns-pixel-icon"
                    :style="pixelIconStyle(pixelImageIcon)"
                    aria-hidden="true"
                  ></span>
                  <span>{{ t(textKeys.styleLabNotebookCard) }}</span>
                  <span class="ns-pixel-desktop-window__controls" aria-hidden="true">
                    <span></span>
                    <span></span>
                    <span></span>
                  </span>
                </div>
                <div class="ns-pixel-desktop-window__body">
                  <div class="ns-pixel-desktop-note-row">
                    <span>{{ t(textKeys.styleLabReady) }}</span>
                    <strong>{{ t(textKeys.statusOpen) }}</strong>
                  </div>
                  <div class="ns-pixel-desktop-note-row">
                    <span>{{ t(textKeys.styleLabNotebookCard) }}</span>
                    <strong>{{ t(textKeys.placeholder) }}</strong>
                  </div>
                </div>
              </aside>

              <nav class="ns-pixel-desktop-taskbar" :aria-label="t(textKeys.menuTitle)">
                <a class="ns-pixel-desktop-taskbar__start" href="#/">
                  <span
                    class="ns-pixel-icon"
                    :style="pixelIconStyle(pixelHomeIcon)"
                    aria-hidden="true"
                  ></span>
                  <span>{{ t(textKeys.styleLabDesktopStart) }}</span>
                </a>
                <span class="ns-pixel-desktop-taskbar__separator" aria-hidden="true"></span>

                <div class="ns-pixel-desktop-taskbar__windows">
                  <a
                    v-for="item in pixelDesktopTaskbarItems"
                    :key="item.id"
                    class="ns-pixel-desktop-taskbar__window"
                    :class="{ 'ns-pixel-desktop-taskbar__window--active': item.active }"
                    :href="item.href"
                  >
                    <span class="ns-pixel-desktop-taskbar__dot" aria-hidden="true"></span>
                    <span>{{ t(item.labelKey) }}</span>
                  </a>
                </div>

                <span class="ns-pixel-desktop-taskbar__separator" aria-hidden="true"></span>
                <span class="ns-pixel-desktop-taskbar__clock">
                  <span class="ns-pixel-desktop-taskbar__sun" aria-hidden="true"></span>
                  <span>{{ t(textKeys.styleLabDesktopDay) }}</span>
                </span>
              </nav>
            </div>
          </section>

          <section
            class="ns-pixel-window ns-pixel-notebook-lab"
            :aria-label="t(textKeys.styleLabNotebookLab)"
          >
            <div class="ns-pixel-window__bar">
              <span class="ns-pixel-window__title">
                <span class="ns-pixel-window__icon" aria-hidden="true"></span>
                {{ t(textKeys.styleLabNotebookLab) }}
              </span>
              <span class="ns-pixel-window__controls" aria-hidden="true">
                <span class="ns-pixel-window__control ns-pixel-window__control--min"></span>
                <span class="ns-pixel-window__control ns-pixel-window__control--max"></span>
                <span class="ns-pixel-window__control ns-pixel-window__control--close"></span>
              </span>
            </div>

            <AppNotebookList
              :items="metaNotebookItems"
              :aria-label="t(textKeys.styleLabNotebookCard)"
            />
          </section>

          <section
            class="ns-pixel-window ns-pixel-workbench"
            :aria-label="t(textKeys.styleLabWorkbenchSample)"
          >
            <div class="ns-pixel-window__bar">
              <span class="ns-pixel-window__title">
                <span class="ns-pixel-window__icon" aria-hidden="true"></span>
                {{ t(textKeys.styleLabWorkbenchSample) }}
              </span>
              <span class="ns-pixel-window__controls" aria-hidden="true">
                <span class="ns-pixel-window__control ns-pixel-window__control--min"></span>
                <span class="ns-pixel-window__control ns-pixel-window__control--max"></span>
                <span class="ns-pixel-window__control ns-pixel-window__control--close"></span>
              </span>
            </div>

            <div
              class="ns-pixel-workbench__toolbar"
              :aria-label="t(textKeys.styleLabWorkbenchToolbar)"
            >
              <button class="ns-pixel-button ns-pixel-button--primary" type="button">
                {{ t(textKeys.import) }}
              </button>
              <button class="ns-pixel-button" type="button">{{ t(textKeys.saveDraft) }}</button>
              <button class="ns-pixel-button ns-pixel-button--blue" type="button">
                {{ t(textKeys.export) }}
              </button>
              <span class="ns-pixel-workbench__hint">
                {{ t(textKeys.styleLabSkinName) }} / {{ t(textKeys.placeholder) }}
              </span>
            </div>

            <div class="ns-pixel-workbench__grid">
              <aside
                class="ns-pixel-workbench__side"
                :aria-label="t(textKeys.styleLabWorkbenchSidebar)"
              >
                <div class="ns-pixel-workbench__panel-title">{{ t(textKeys.styleLabTools) }}</div>
                <button class="ns-pixel-tool-row ns-pixel-tool-row--active" type="button">
                  <span>{{ t(textKeys.styleLabEquipmentPanel) }}</span>
                  <small>12</small>
                </button>
                <button class="ns-pixel-tool-row" type="button">
                  <span>{{ t(textKeys.styleLabTemplate) }}</span>
                  <small>06</small>
                </button>
                <button class="ns-pixel-tool-row" type="button">
                  <span>{{ t(textKeys.styleLabAssets) }}</span>
                  <small>03</small>
                </button>

                <div class="ns-pixel-workbench__panel-title">{{ t(textKeys.styleLabLayers) }}</div>
                <div class="ns-pixel-layer-stack">
                  <span>{{ t(textKeys.styleLabTitleField) }}</span>
                  <span>{{ t(textKeys.styleLabCharacter) }}</span>
                  <span>{{ t(textKeys.styleLabEquipment) }}</span>
                  <span>{{ t(textKeys.styleLabBackground) }}</span>
                </div>
              </aside>

              <section
                class="ns-pixel-workbench__canvas"
                :aria-label="t(textKeys.styleLabWorkbenchCanvas)"
              >
                <div class="ns-pixel-canvas-card">
                  <div class="ns-pixel-canvas-card__chrome">
                    <span>{{ t(textKeys.styleLabWorkbenchCanvas) }}</span>
                    <span>{{ styleLabCanvasSize }}</span>
                  </div>
                  <div class="ns-pixel-canvas-card__body">
                    <div class="ns-pixel-canvas-card__avatar" aria-hidden="true"></div>
                    <div class="ns-pixel-canvas-card__lines">
                      <span></span>
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <p>{{ t(textKeys.placeholder) }}</p>
                  </div>
                </div>
              </section>

              <aside
                class="ns-pixel-workbench__inspector"
                :aria-label="t(textKeys.styleLabWorkbenchInspector)"
              >
                <div class="ns-pixel-workbench__panel-title">
                  {{ t(textKeys.styleLabInspector) }}
                </div>
                <label class="ns-pixel-label">
                  {{ t(textKeys.styleLabTitleField) }}
                  <input class="ns-pixel-input" type="text" :value="t(textKeys.placeholder)" />
                </label>
                <label class="ns-pixel-label">
                  {{ t(textKeys.styleLabLanguage) }}
                  <select class="ns-pixel-select">
                    <option v-for="option in siteLocaleOptions" :key="option.locale">
                      {{ t(option.labelKey) }}
                    </option>
                  </select>
                </label>
                <div class="ns-pixel-mini-meters" :aria-label="t(textKeys.styleLabWorkbenchMeters)">
                  <span style="--meter-width: 72%"></span>
                  <span style="--meter-width: 48%"></span>
                  <span style="--meter-width: 86%"></span>
                </div>
              </aside>
            </div>

            <div class="ns-pixel-workbench__status">
              <span>{{ t(textKeys.styleLabReady) }}</span>
              <span>12 {{ t(textKeys.itemsUnit) }}</span>
              <span>{{ t(textKeys.placeholder) }}</span>
            </div>
          </section>

          <section
            class="ns-pixel-window ns-pixel-page-turn-lab"
            :aria-label="t(textKeys.nsglamourWorkspace)"
          >
            <div class="ns-pixel-window__bar">
              <span class="ns-pixel-window__title">
                <span class="ns-pixel-window__icon" aria-hidden="true"></span>
                {{ t(textKeys.nsglamourWorkspace) }}
              </span>
              <span class="ns-pixel-window__controls" aria-hidden="true">
                <span class="ns-pixel-window__control ns-pixel-window__control--min"></span>
                <span class="ns-pixel-window__control ns-pixel-window__control--max"></span>
                <span class="ns-pixel-window__control ns-pixel-window__control--close"></span>
              </span>
            </div>

            <div class="ns-pixel-page-turn-lab__stage">
              <button
                class="ns-pixel-page-turn ns-pixel-page-turn--prev"
                type="button"
                :aria-label="t(textKeys.nsglamourTemplatePage)"
              >
                <span
                  class="ns-pixel-page-turn__arrow"
                  :style="pixelIconStyle(pixelChevronLeftIcon)"
                  aria-hidden="true"
                ></span>
                <span class="ns-pixel-page-turn__label">
                  {{ t(textKeys.nsglamourTemplatePage) }}
                </span>
              </button>

              <button
                class="ns-pixel-page-turn ns-pixel-page-turn--next"
                type="button"
                :aria-label="t(textKeys.nsglamourEquipInfoPage)"
              >
                <span
                  class="ns-pixel-page-turn__arrow"
                  :style="pixelIconStyle(pixelChevronRightIcon)"
                  aria-hidden="true"
                ></span>
                <span class="ns-pixel-page-turn__label">
                  {{ t(textKeys.nsglamourEquipInfoPage) }}
                </span>
              </button>
            </div>
          </section>

          <section
            class="ns-pixel-window ns-pixel-rail-reflow-lab"
            :aria-label="t(textKeys.nsarmoireSectionNavigation)"
          >
            <div class="ns-pixel-window__bar">
              <span class="ns-pixel-window__title">
                <span class="ns-pixel-window__icon" aria-hidden="true"></span>
                {{ t(textKeys.nsarmoireSectionNavigation) }}
              </span>
              <span class="ns-pixel-window__controls" aria-hidden="true">
                <span class="ns-pixel-window__control ns-pixel-window__control--min"></span>
                <span class="ns-pixel-window__control ns-pixel-window__control--max"></span>
                <span class="ns-pixel-window__control ns-pixel-window__control--close"></span>
              </span>
            </div>

            <div class="ns-pixel-rail-reflow" :aria-label="t(textKeys.nsarmoireSectionNavigation)">
              <nav class="ns-pixel-rail-reflow__rail">
                <button
                  v-for="item in pixelRailDemoItems"
                  :key="item.id"
                  class="ns-pixel-rail-reflow__item"
                  :class="{ 'ns-pixel-rail-reflow__item--active': item.active }"
                  type="button"
                  :aria-label="t(item.labelKey)"
                  :title="t(item.labelKey)"
                >
                  <span
                    class="ns-pixel-rail-reflow__icon"
                    :style="pixelIconStyle(item.icon)"
                    aria-hidden="true"
                  ></span>
                  <span class="ns-pixel-rail-reflow__label">{{ t(item.labelKey) }}</span>
                </button>
              </nav>

              <section
                class="ns-pixel-rail-reflow__content"
                :aria-label="t(textKeys.styleLabWorkbenchCanvas)"
              >
                <div class="ns-pixel-rail-reflow__toolbar">
                  <span>{{ t(textKeys.nsarmoireSectionCleanup) }}</span>
                  <span>{{ t(textKeys.styleLabReady) }}</span>
                </div>
                <div class="ns-pixel-rail-reflow__grid">
                  <article class="ns-pixel-rail-reflow__card">
                    <strong>{{ t(textKeys.nsarmoireSectionStorage) }}</strong>
                    <span>{{ t(textKeys.placeholder) }}</span>
                  </article>
                  <article class="ns-pixel-rail-reflow__card">
                    <strong>{{ t(textKeys.nsarmoireSectionCollection) }}</strong>
                    <span>{{ t(textKeys.placeholder) }}</span>
                  </article>
                </div>
              </section>
            </div>
          </section>

          <section class="ns-pixel-window">
            <div class="ns-pixel-window__bar">
              <span class="ns-pixel-window__title">
                <span class="ns-pixel-window__icon" aria-hidden="true"></span>
                {{ t(textKeys.styleLabToolbarSample) }}
              </span>
              <span class="ns-pixel-window__controls" aria-hidden="true">
                <span class="ns-pixel-window__control ns-pixel-window__control--min"></span>
                <span class="ns-pixel-window__control ns-pixel-window__control--max"></span>
                <span class="ns-pixel-window__control ns-pixel-window__control--close"></span>
              </span>
            </div>

            <div class="ns-pixel-toolbar" :aria-label="t(textKeys.styleLabToolbarSample)">
              <button class="ns-pixel-button ns-pixel-button--primary" type="button">
                {{ t(textKeys.save) }}
              </button>
              <button class="ns-pixel-button" type="button">{{ t(textKeys.import) }}</button>
              <button class="ns-pixel-button ns-pixel-button--blue" type="button">
                {{ t(textKeys.export) }}
              </button>
            </div>

            <hr class="ns-pixel-divider" />

            <div class="ns-pixel-form-grid">
              <label class="ns-pixel-label">
                {{ t(textKeys.styleLabName) }}
                <input class="ns-pixel-input" type="text" :value="t(textKeys.siteEnName)" />
              </label>

              <label class="ns-pixel-label">
                {{ t(textKeys.styleLabModule) }}
                <select class="ns-pixel-select">
                  <option v-for="option in styleLabModuleOptions" :key="option.id">
                    {{ moduleOptionLabel(option) }}
                  </option>
                </select>
              </label>
            </div>
          </section>

          <section class="ns-pixel-window">
            <div class="ns-pixel-window__bar">
              <span class="ns-pixel-window__title">
                <span class="ns-pixel-window__icon" aria-hidden="true"></span>
                {{ t(textKeys.styleLabCommonToolbarPreview) }}
              </span>
              <span class="ns-pixel-window__controls" aria-hidden="true">
                <span class="ns-pixel-window__control ns-pixel-window__control--min"></span>
                <span class="ns-pixel-window__control ns-pixel-window__control--max"></span>
                <span class="ns-pixel-window__control ns-pixel-window__control--close"></span>
              </span>
            </div>

            <div class="style-common-components">
              <AppToolbar
                :title="t(textKeys.styleLabAppToolbar)"
                :aria-label="t(textKeys.styleLabCommonToolbarPreview)"
              >
                <AppButton variant="primary">{{ t(textKeys.placeholder) }}</AppButton>
                <AppButton>{{ t(textKeys.placeholder) }}</AppButton>

                <template #end>
                  <AppStatus compact tone="success" :message="t(textKeys.placeholder)" />
                </template>
              </AppToolbar>

              <AppTabs
                v-model="commonTab"
                :items="commonTabs"
                :aria-label="t(textKeys.styleLabCommonTabsPreview)"
                stretch
              />

              <div class="style-common-components__grid">
                <AppField
                  :label="t(textKeys.placeholder)"
                  for-id="style-lab-common-title"
                  :description="t(textKeys.placeholder)"
                >
                  <input id="style-lab-common-title" type="text" :value="t(textKeys.placeholder)" />
                </AppField>

                <AppField :label="t(textKeys.placeholder)" for-id="style-lab-common-module">
                  <select id="style-lab-common-module">
                    <option v-for="option in styleLabToolOptions" :key="option.id">
                      {{ moduleOptionLabel(option) }}
                    </option>
                  </select>
                </AppField>
              </div>

              <AppStatus
                tone="info"
                :title="t(textKeys.styleLabAppStatus)"
                :message="t(textKeys.placeholder)"
              >
                <template #actions>
                  <AppButton>{{ t(textKeys.placeholder) }}</AppButton>
                </template>
              </AppStatus>
            </div>
          </section>

          <section class="ns-pixel-grid" :aria-label="t(textKeys.styleLabToolCardSamples)">
            <article class="ns-pixel-card">
              <span class="ns-pixel-badge ns-pixel-badge--pink">{{
                t(textKeys.styleLabToolBadge)
              }}</span>
              <h2 class="ns-pixel-card__title">{{ t(textKeys.glamourTitle) }}</h2>
              <p class="ns-pixel-card__text">
                {{ t(textKeys.placeholder) }}
              </p>
              <button class="ns-pixel-button ns-pixel-button--primary" type="button">
                {{ t(textKeys.open) }}
              </button>
            </article>

            <article class="ns-pixel-card ns-pixel-card--blue">
              <span class="ns-pixel-badge">{{ t(textKeys.styleLabToolBadge) }}</span>
              <h2 class="ns-pixel-card__title">{{ t(textKeys.plateTitle) }}</h2>
              <p class="ns-pixel-card__text">{{ t(textKeys.placeholder) }}</p>
              <button class="ns-pixel-button ns-pixel-button--blue" type="button">
                {{ t(textKeys.open) }}
              </button>
            </article>

            <article class="ns-pixel-card">
              <span class="ns-pixel-badge ns-pixel-badge--green">
                <img class="ns-pixel-badge__icon" :src="pixelArchiveIcon" alt="" aria-hidden="true" />
                {{ t(textKeys.styleLabToolBadge) }}
              </span>
              <h2 class="ns-pixel-card__title">
                <img
                  class="ns-pixel-card__title-icon"
                  :src="pixelArchiveIcon"
                  alt=""
                  aria-hidden="true"
                />
                {{ t(textKeys.armoireTitle) }}
              </h2>
              <p class="ns-pixel-card__text">{{ t(textKeys.placeholder) }}</p>
              <button class="ns-pixel-button" type="button">{{ t(textKeys.open) }}</button>
            </article>
          </section>
        </div>
      </div>
    </section>

    <AppLoading
      v-if="isStyleLabLoadingPreviewVisible"
      overlay
      size="lg"
      :aria-label="t(textKeys.styleLabLoadingPreview)"
    />
  </main>
</template>

<script setup lang="ts">
import '@/styles/experiments/pixel-soft.css'
import { computed, onBeforeUnmount, ref, watch, type CSSProperties } from 'vue'
import pixelChevronLeftIcon from '@/assets/icons/chevron-left.svg'
import pixelChevronRightIcon from '@/assets/icons/chevron-right.svg'
import pixelArchiveIcon from '@/assets/icons/pixelarticons/archive.svg'
import pixelAvatarCircleIcon from '@/assets/icons/pixelarticons/avatar-circle.svg'
import pixelBroomIcon from '@/assets/icons/pixelarticons/broom.svg'
import pixelDownloadIcon from '@/assets/icons/pixelarticons/download.svg'
import pixelFolderIcon from '@/assets/icons/pixelarticons/folder.svg'
import pixelHomeIcon from '@/assets/icons/pixelarticons/home.svg'
import pixelImageIcon from '@/assets/icons/pixelarticons/image.svg'
import pixelLanguagesIcon from '@/assets/icons/pixelarticons/languages.svg'
import pixelMenuIcon from '@/assets/icons/pixelarticons/menu.svg'
import pixelSearchIcon from '@/assets/icons/pixelarticons/search.svg'
import pixelSettingsIcon from '@/assets/icons/pixelarticons/settings-2.svg'
import pixelSparklesIcon from '@/assets/icons/pixelarticons/sparkles.svg'
import pixelStarIcon from '@/assets/icons/pixelarticons/star.svg'
import pixelUserIcon from '@/assets/icons/pixelarticons/user.svg'
import AppButton from '@/components/AppButton.vue'
import AppField from '@/components/AppField.vue'
import AppLoading from '@/components/AppLoading.vue'
import AppNotebookList from '@/components/AppNotebookList.vue'
import AppPixelWindow from '@/components/AppPixelWindow.vue'
import AppStatus from '@/components/AppStatus.vue'
import AppTabs from '@/components/AppTabs.vue'
import AppToolbar from '@/components/AppToolbar.vue'
import { ffxivTools, siteLocaleOptions } from '@/config/site'
import { allTextKeys as textKeys } from '@/locales/keys/all'
import { useLocale } from '@/stores/locale'
import { useTheme, type ThemeMode } from '@/stores/theme'

const pixelPlaceholderMenuIcon =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 8 8%22 fill=%22%23000%22 shape-rendering=%22crispEdges%22%3E%3Cpath d=%22M1 0h6v1H1zM0 1h1v5H0zM7 1h1v5H7zM1 6h6v1H1zM2 2h1v1H2zM5 2h1v1H5zM3 3h2v1H3zM2 4h4v1H2z%22/%3E%3C/svg%3E'

type FontMode = 'decorative' | 'all-pixel'
type PixelTone = 'classic' | 'light' | 'cyber-night'
type PixelIconVariant = 'plain' | 'pink' | 'blue'
type StyleLabModuleOption = { id: string; label?: string; labelKey?: string }
type PixelIconAction = {
  id: string
  icon: string
  labelKey: string
  variant?: PixelIconVariant
}
type PixelIconMenuItem = PixelIconAction & {
  commandKey: string
  href?: string
  active?: boolean
  section?: 'ffxiv' | 'silence'
  children?: Array<{
    id: string
    icon: string
    href: string
    labelKey: string
  }>
}
type PixelIconBarAction = PixelIconAction & {
  commandKey?: string
  active?: boolean
}

const { t } = useLocale()
const { current: themeMode } = useTheme()
const localAssetBase = import.meta.env.VITE_LOCAL_ASSET_BASE
const styleLabLocalArtStyle = {
  '--style-lab-character-art-url': import.meta.env.DEV
    ? `url("${localAssetBase}/yoine-1.png")`
    : 'none'
} as CSSProperties
const fontMode = ref<FontMode>('decorative')
const pixelTone = ref<PixelTone>(defaultPixelTone(themeMode.value))
const styleLabCanvasSize = '1440 x 1920'
const styleLabToolOptions: StyleLabModuleOption[] = ffxivTools.map((tool) => ({
  id: tool.id,
  label: tool.projectName
}))
const styleLabModuleOptions: StyleLabModuleOption[] = [
  { id: 'ffxiv', labelKey: textKeys.ffxivWorkshopShort },
  ...styleLabToolOptions
]

const fontModeOptions: Array<{ labelKey: string; value: FontMode }> = [
  { labelKey: textKeys.styleLabDecorativePixels, value: 'decorative' },
  { labelKey: textKeys.styleLabAllPixels, value: 'all-pixel' }
]

const pixelToneOptions: Array<{ labelKey: string; value: PixelTone }> = [
  { labelKey: textKeys.styleLabCurrentPixel, value: 'classic' },
  { labelKey: textKeys.styleLabLightPixel, value: 'light' },
  { labelKey: textKeys.styleLabCyberNight, value: 'cyber-night' }
]
const pixelIconButtons: PixelIconAction[] = [
  { id: 'home', icon: pixelHomeIcon, labelKey: textKeys.styleLabIconHome, variant: 'pink' },
  { id: 'menu', icon: pixelMenuIcon, labelKey: textKeys.styleLabIconMenu },
  { id: 'config', icon: pixelSettingsIcon, labelKey: textKeys.styleLabIconConfig },
  { id: 'search', icon: pixelSearchIcon, labelKey: textKeys.styleLabIconSearch, variant: 'blue' },
  { id: 'language', icon: pixelLanguagesIcon, labelKey: textKeys.styleLabIconLanguage },
  { id: 'favorite', icon: pixelStarIcon, labelKey: textKeys.styleLabIconFavorite, variant: 'pink' }
]
const pixelTextIconButtons: PixelIconAction[] = [
  {
    id: 'download',
    icon: pixelDownloadIcon,
    labelKey: textKeys.styleLabIconDownload,
    variant: 'pink'
  },
  { id: 'image', icon: pixelImageIcon, labelKey: textKeys.styleLabIconImage, variant: 'blue' },
  { id: 'folder', icon: pixelFolderIcon, labelKey: textKeys.styleLabIconFolder },
  { id: 'search', icon: pixelSearchIcon, labelKey: textKeys.styleLabIconSearch }
]
const pixelIconBarActions: PixelIconBarAction[] = [
  {
    id: 'menu',
    icon: pixelMenuIcon,
    labelKey: textKeys.menu,
    commandKey: textKeys.menuCommand,
    active: true
  },
  {
    id: 'config',
    icon: pixelSettingsIcon,
    labelKey: textKeys.config,
    commandKey: textKeys.configCommand,
    variant: 'pink'
  }
]
const pixelRailDemoItems: PixelIconBarAction[] = [
  {
    id: 'cleanup',
    icon: pixelBroomIcon,
    labelKey: textKeys.nsarmoireSectionCleanup,
    active: true
  },
  {
    id: 'collection',
    icon: pixelArchiveIcon,
    labelKey: textKeys.nsarmoireSectionCollection
  },
  {
    id: 'characters',
    icon: pixelUserIcon,
    labelKey: textKeys.nsarmoireSectionCharacters
  }
]
const pixelIconMenuItems: PixelIconMenuItem[] = [
  {
    id: 'home',
    icon: pixelHomeIcon,
    labelKey: textKeys.home,
    commandKey: textKeys.homeCommand,
    href: '#/'
  },
  {
    id: 'ffxiv',
    icon: pixelFolderIcon,
    labelKey: textKeys.ffxivWorkshop,
    commandKey: textKeys.statusOpen,
    section: 'ffxiv',
    children: [
      {
        id: 'glamour',
        icon: pixelSparklesIcon,
        href: '#/ffxiv/glamour',
        labelKey: textKeys.glamourTitle
      },
      {
        id: 'plate',
        icon: pixelAvatarCircleIcon,
        href: '#/ffxiv/plate',
        labelKey: textKeys.plateTitle
      },
      {
        id: 'armoire',
        icon: pixelArchiveIcon,
        href: '#/ffxiv/armoire',
        labelKey: textKeys.armoireTitle
      }
    ]
  },
  {
    id: 'config',
    icon: pixelSettingsIcon,
    labelKey: textKeys.config,
    commandKey: textKeys.configCommand,
    href: '#/style-lab'
  },
  {
    id: 'about',
    icon: pixelStarIcon,
    labelKey: textKeys.about,
    commandKey: textKeys.aboutCommand,
    href: '#/about'
  }
]
const pixelDesktopIcons: Array<PixelIconAction & { href: string }> = [
  {
    id: 'silence-archive',
    icon: pixelFolderIcon,
    labelKey: textKeys.styleLabDesktopSilenceArchive,
    href: '#/silence'
  },
  { id: 'angel', icon: pixelUserIcon, labelKey: textKeys.styleLabDesktopAngel, href: '#/silence/angel' },
  {
    id: 'glitch',
    icon: pixelSparklesIcon,
    labelKey: textKeys.styleLabDesktopGlitch,
    href: '#/silence/glitch'
  },
  { id: 'network', icon: pixelStarIcon, labelKey: textKeys.styleLabDesktopNetwork, href: '#/about' }
]
const pixelDesktopTools: Array<PixelIconAction & { href: string }> = [
  {
    id: 'glamour',
    icon: pixelSparklesIcon,
    labelKey: textKeys.glamourTitle,
    href: '#/ffxiv/glamour'
  },
  {
    id: 'plate',
    icon: pixelAvatarCircleIcon,
    labelKey: textKeys.plateTitle,
    href: '#/ffxiv/plate'
  },
  {
    id: 'armoire',
    icon: pixelArchiveIcon,
    labelKey: textKeys.armoireTitle,
    href: '#/ffxiv/armoire'
  }
]
const pixelDesktopTaskbarItems: Array<PixelIconAction & { href: string; active?: boolean }> = [
  {
    id: 'status',
    icon: pixelStarIcon,
    labelKey: textKeys.status,
    href: '#/style-lab',
    active: true
  },
  { id: 'home-window', icon: pixelHomeIcon, labelKey: textKeys.siteEnName, href: '#/' },
  { id: 'ffxiv-tools', icon: pixelFolderIcon, labelKey: textKeys.ffxivWorkshop, href: '#/ffxiv' },
  { id: 'note', icon: pixelImageIcon, labelKey: textKeys.styleLabNotebookCard, href: '#/style-lab' }
]
const metaNotebookRows: Array<{
  id: string
  labelKey: string
  valueKey: string
  active: boolean
}> = [
  {
    id: 'portrait-bg',
    labelKey: textKeys.nsplateCategoryPortraitBackground,
    valueKey: textKeys.notSelected,
    active: false
  },
  {
    id: 'portrait-frame',
    labelKey: textKeys.nsplateCategoryPortraitDecorFrame,
    valueKey: textKeys.notSelected,
    active: false
  },
  {
    id: 'portrait-deco',
    labelKey: textKeys.nsplateCategoryPortraitDecoration,
    valueKey: textKeys.notSelected,
    active: false
  },
  {
    id: 'nameplate-backing',
    labelKey: textKeys.nsplateCategoryNameplateBase,
    valueKey: textKeys.notSelected,
    active: false
  },
  {
    id: 'nameplate-color',
    labelKey: textKeys.nsplateCategoryNameplateColor,
    valueKey: textKeys.notSelected,
    active: false
  },
  {
    id: 'nameplate-pattern',
    labelKey: textKeys.nsplateCategoryNameplatePattern,
    valueKey: textKeys.notSelected,
    active: false
  },
  {
    id: 'nameplate-frame',
    labelKey: textKeys.nsplateCategoryNameplateFrame,
    valueKey: textKeys.notSelected,
    active: false
  },
  {
    id: 'nameplate-top',
    labelKey: textKeys.nsplateCategoryNameplateTopDecor,
    valueKey: textKeys.notSelected,
    active: false
  },
  {
    id: 'nameplate-bottom',
    labelKey: textKeys.nsplateCategoryNameplateBottomDecor,
    valueKey: textKeys.notSelected,
    active: false
  },
  {
    id: 'nameplate-decoration',
    labelKey: textKeys.nsplateCategoryNameplateDecoration,
    valueKey: textKeys.notSelected,
    active: false
  },
  {
    id: 'nameplate-decoration-alt',
    labelKey: textKeys.nsplateCategoryNameplateDecorationAlt,
    valueKey: textKeys.notSelected,
    active: false
  },
  {
    id: 'portrait-outer-frame',
    labelKey: textKeys.nsplateCategoryPortraitFrame,
    valueKey: textKeys.notSelected,
    active: false
  }
]
const metaNotebookItems = computed(() =>
  metaNotebookRows.map((item) => ({
    id: item.id,
    label: t(item.labelKey),
    value: t(item.valueKey),
    active: item.active
  }))
)
const commonTab = ref('field')
const formalTab = ref('field')

const commonTabs = computed(() =>
  [
    { labelKey: textKeys.styleLabAppField, value: 'field', meta: '01' },
    { labelKey: textKeys.styleLabAppToolbar, value: 'toolbar', meta: '02' },
    { labelKey: textKeys.styleLabAppStatus, value: 'status', meta: '03' }
  ].map((item) => ({ ...item, label: t(item.labelKey) }))
)

const formalTabs = commonTabs
const effectivePixelTone = computed<PixelTone>(() => pixelTone.value)
const styleLabPopupSection = ref<'ffxiv' | 'silence'>('ffxiv')
const styleLabIconMenuSection = ref<'ffxiv' | 'silence' | null>('ffxiv')
const isStyleLabLoadingPreviewVisible = ref(false)
let styleLabLoadingPreviewTimer = 0

watch(themeMode, (mode) => {
  pixelTone.value = defaultPixelTone(mode, pixelTone.value)
})

onBeforeUnmount(() => {
  clearStyleLabLoadingPreviewTimer()
})

function defaultPixelTone(mode: ThemeMode, preferredTone: PixelTone = 'classic'): PixelTone {
  if (mode === 'night') {
    return 'cyber-night'
  }

  return preferredTone === 'cyber-night' ? 'classic' : preferredTone
}

function setPixelTone(tone: PixelTone) {
  pixelTone.value = tone
}

function clearStyleLabLoadingPreviewTimer() {
  if (!styleLabLoadingPreviewTimer) {
    return
  }

  window.clearTimeout(styleLabLoadingPreviewTimer)
  styleLabLoadingPreviewTimer = 0
}

function showStyleLabLoadingPreview() {
  isStyleLabLoadingPreviewVisible.value = true
  clearStyleLabLoadingPreviewTimer()
  styleLabLoadingPreviewTimer = window.setTimeout(() => {
    isStyleLabLoadingPreviewVisible.value = false
    styleLabLoadingPreviewTimer = 0
  }, 3200)
}

function pixelIconStyle(icon: string): CSSProperties {
  return {
    '--ns-pixel-icon-url': `url("${icon}")`
  } as CSSProperties
}

function moduleOptionLabel(option: StyleLabModuleOption) {
  return option.labelKey ? t(option.labelKey) : (option.label ?? option.id)
}

function toggleStyleLabPopupSection(section: 'ffxiv' | 'silence') {
  styleLabPopupSection.value = section
}

function setStyleLabIconMenuSection(section: 'ffxiv' | 'silence' | undefined) {
  if (!section) {
    return
  }

  styleLabIconMenuSection.value = section
}
</script>

<style scoped>
.style-lab-page {
  min-height: 100vh;
  background: var(--ns-body-background);
  color: var(--ns-color-text);
}

.style-formal-sample {
  padding: 36px 0 0;
}

.style-formal-sample__shell {
  width: min(var(--ns-content-width), calc(100vw - 32px));
  margin: 0 auto;
}

.style-formal-sample__content {
  display: grid;
  min-width: 0;
  gap: 16px;
}

.style-formal-sample__button-row {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  gap: 10px;
}

.style-formal-sample__grid,
.style-formal-sample__states,
.style-formal-sample__loading {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.style-formal-sample__loading-action {
  display: grid;
  grid-column: 1 / -1;
  min-width: 0;
  align-items: start;
  gap: 10px;
}

.style-lab-experiment[data-pixel-tone='cyber-night'] :deep(.ns-pixel-stage) {
  background: transparent;
}

.style-common-components {
  display: grid;
  min-width: 0;
  gap: 16px;
}

.style-common-components__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.ns-pixel-page-turn-lab {
  margin-bottom: 30px;
  gap: 16px;
}

.ns-pixel-page-turn-lab__stage {
  position: relative;
  display: grid;
  grid-template-columns: repeat(2, minmax(142px, 174px));
  gap: 14px;
  align-items: center;
  justify-content: center;
  min-height: 106px;
  padding: 12px;
  border: 2px solid var(--ns-pixel-border);
  background:
    linear-gradient(90deg, rgba(255, 124, 194, 0.08) 1px, transparent 1px),
    linear-gradient(0deg, rgba(94, 220, 235, 0.08) 1px, transparent 1px),
    var(--ns-pixel-surface-blue);
  background-size: 14px 14px;
}

.ns-pixel-page-turn {
  display: inline-flex;
  overflow: hidden;
  width: 40px;
  min-width: 0;
  height: 52px;
  align-items: center;
  gap: 8px;
  padding: 0 8px;
  border: 2px solid transparent;
  background: transparent;
  color: var(--ns-pixel-ink);
  font-family: var(--ns-pixel-font);
  font-weight: 900;
  cursor: pointer;
  box-shadow: none;
  transition: none;
}

.ns-pixel-page-turn--prev {
  flex-direction: row-reverse;
  justify-self: end;
}

.ns-pixel-page-turn--next {
  justify-self: start;
}

.ns-pixel-page-turn:hover,
.ns-pixel-page-turn:focus-visible {
  width: 146px;
  border-color: var(--ns-pixel-border);
  background: var(--ns-pixel-surface-pink);
  box-shadow: 4px 4px 0 var(--ns-pixel-shadow);
  outline: 0;
  transform: translate(-1px, -1px);
}

.ns-pixel-page-turn:active {
  box-shadow: 1px 1px 0 var(--ns-pixel-shadow);
  transform: translate(2px, 2px);
}

.ns-pixel-page-turn--next:hover,
.ns-pixel-page-turn--next:focus-visible {
  background: var(--ns-pixel-surface-blue);
}

.ns-pixel-page-turn__arrow {
  display: block;
  flex: 0 0 auto;
  width: 20px;
  height: 20px;
  background: currentColor;
  image-rendering: pixelated;
  mask: var(--ns-pixel-icon-url) center / 100% 100% no-repeat;
  -webkit-mask: var(--ns-pixel-icon-url) center / 100% 100% no-repeat;
}

.ns-pixel-page-turn__label {
  display: grid;
  overflow: hidden;
  width: 86px;
  max-width: 0;
  min-height: 32px;
  place-items: center;
  font-size: 13px;
  line-height: 1.15;
  opacity: 0;
  text-align: center;
  transform: translateX(-8px);
  transition: none;
  white-space: normal;
  word-break: keep-all;
  overflow-wrap: anywhere;
}

.ns-pixel-page-turn--prev .ns-pixel-page-turn__label {
  transform: translateX(8px);
}

.ns-pixel-page-turn:hover .ns-pixel-page-turn__label,
.ns-pixel-page-turn:focus-visible .ns-pixel-page-turn__label {
  max-width: 86px;
  opacity: 1;
  transform: translateX(0);
}

.ns-pixel-page-turn:focus-visible {
  box-shadow:
    0 0 0 3px var(--ns-focus-ring),
    4px 4px 0 var(--ns-pixel-shadow);
}

@media (prefers-reduced-motion: reduce) {
  .ns-pixel-page-turn,
  .ns-pixel-page-turn__label {
    transition: none;
  }
}

.ns-pixel-rail-reflow-lab {
  margin-bottom: 30px;
  gap: 16px;
}

.ns-pixel-rail-reflow {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);
  min-height: 236px;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-pixel-surface-blue);
  transition: none;
}

.ns-pixel-rail-reflow:has(.ns-pixel-rail-reflow__rail:hover),
.ns-pixel-rail-reflow:has(.ns-pixel-rail-reflow__rail:focus-within) {
  grid-template-columns: 132px minmax(0, 1fr);
}

.ns-pixel-rail-reflow__rail {
  display: grid;
  align-content: center;
  gap: 8px;
  min-width: 0;
  padding: 10px 5px;
  border-right: 2px solid var(--ns-pixel-border);
  background: var(--ns-pixel-surface-pink);
}

.ns-pixel-rail-reflow__item {
  display: grid;
  overflow: hidden;
  grid-template-columns: 22px 0;
  align-items: center;
  justify-content: center;
  justify-items: center;
  gap: 0;
  width: 34px;
  min-height: 40px;
  padding: 5px;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-pixel-surface);
  color: var(--ns-pixel-ink);
  font-family: var(--ns-pixel-font);
  font-size: 12px;
  font-weight: 900;
  cursor: pointer;
  box-shadow: 2px 2px 0 rgba(42, 33, 56, 0.16);
  transition: none;
}

.ns-pixel-rail-reflow__rail:hover .ns-pixel-rail-reflow__item,
.ns-pixel-rail-reflow__rail:focus-within .ns-pixel-rail-reflow__item {
  grid-template-columns: 22px minmax(0, 1fr);
  justify-content: start;
  justify-items: start;
  gap: 8px;
  width: 100%;
}

.ns-pixel-rail-reflow__item:hover,
.ns-pixel-rail-reflow__item:focus-visible,
.ns-pixel-rail-reflow__item--active {
  background: var(--ns-pixel-surface-blue);
  outline: 0;
}

.ns-pixel-rail-reflow__icon {
  display: block;
  flex: 0 0 auto;
  width: 22px;
  height: 22px;
  background: currentColor;
  image-rendering: pixelated;
  mask: var(--ns-pixel-icon-url) center / 18px 18px no-repeat;
  -webkit-mask: var(--ns-pixel-icon-url) center / 18px 18px no-repeat;
}

.ns-pixel-rail-reflow__label {
  overflow: hidden;
  max-width: 0;
  opacity: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: none;
}

.ns-pixel-rail-reflow__rail:hover .ns-pixel-rail-reflow__label,
.ns-pixel-rail-reflow__rail:focus-within .ns-pixel-rail-reflow__label {
  max-width: 82px;
  opacity: 1;
}

.ns-pixel-rail-reflow__content {
  display: grid;
  align-content: start;
  min-width: 0;
  gap: 10px;
  padding: 12px;
  background:
    linear-gradient(90deg, rgba(255, 124, 194, 0.08) 1px, transparent 1px),
    linear-gradient(0deg, rgba(94, 220, 235, 0.08) 1px, transparent 1px),
    var(--ns-pixel-surface);
  background-size: 14px 14px;
}

.ns-pixel-rail-reflow__toolbar {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 34px;
  padding: 0 10px;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-pixel-surface);
  color: var(--ns-pixel-ink);
  font-family: var(--ns-pixel-font);
  font-size: 12px;
  font-weight: 900;
  box-shadow: 2px 2px 0 rgba(42, 33, 56, 0.16);
}

.ns-pixel-rail-reflow__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  min-width: 0;
}

.ns-pixel-rail-reflow__card {
  display: grid;
  align-content: start;
  min-width: 0;
  min-height: 136px;
  gap: 8px;
  padding: 10px;
  border: 2px solid var(--ns-pixel-border);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 2px 2px 0 rgba(42, 33, 56, 0.16);
}

.ns-pixel-rail-reflow__card strong {
  color: var(--ns-pixel-ink);
  font-family: var(--ns-pixel-font);
  font-size: 13px;
  font-weight: 900;
}

.ns-pixel-rail-reflow__card span {
  color: var(--ns-pixel-muted);
  font-size: 12px;
  line-height: 1.5;
}

.style-lab-experiment[data-pixel-tone='cyber-night'] .ns-pixel-rail-reflow {
  background: var(--ns-pixel-cyber-menu-stage-bg);
  box-shadow: var(--ns-pixel-cyber-panel-shadow);
}

.style-lab-experiment[data-pixel-tone='cyber-night'] .ns-pixel-rail-reflow__rail {
  background: var(--ns-pixel-cyber-chrome-bg);
}

.style-lab-experiment[data-pixel-tone='cyber-night'] .ns-pixel-rail-reflow__content {
  background:
    linear-gradient(90deg, rgba(255, 95, 184, 0.08) 1px, transparent 1px),
    linear-gradient(0deg, rgba(94, 234, 255, 0.08) 1px, transparent 1px),
    var(--ns-pixel-surface);
}

.style-lab-experiment[data-pixel-tone='cyber-night'] .ns-pixel-rail-reflow__item,
.style-lab-experiment[data-pixel-tone='cyber-night'] .ns-pixel-rail-reflow__toolbar,
.style-lab-experiment[data-pixel-tone='cyber-night'] .ns-pixel-rail-reflow__card {
  background: var(--ns-pixel-cyber-card-bg);
  box-shadow: var(--ns-pixel-cyber-ui-shadow);
}

.style-lab-experiment[data-pixel-tone='cyber-night'] .ns-pixel-rail-reflow__item:hover,
.style-lab-experiment[data-pixel-tone='cyber-night'] .ns-pixel-rail-reflow__item:focus-visible,
.style-lab-experiment[data-pixel-tone='cyber-night'] .ns-pixel-rail-reflow__item--active {
  background: var(--ns-pixel-cyber-card-blue-bg);
}

.ns-pixel-menu-popup--animated-icons .ns-pixel-icon {
  transform-origin: center;
}

.ns-pixel-menu-popup--animated-icons
  :is(
    .ns-pixel-popup-menu__item:hover,
    .ns-pixel-popup-menu__item:focus-visible,
    .ns-pixel-popup-menu__item--active,
    .ns-pixel-popup-menu__children a:hover,
    .ns-pixel-popup-menu__children a:focus-visible
  )
  .ns-pixel-icon {
  animation: ns-pixel-menu-icon-step 420ms steps(2, jump-none) infinite;
}

.ns-pixel-menu-popup--animated-icons
  :is(.ns-pixel-popup-menu__item--active, .ns-pixel-popup-menu__item--expanded)
  > .ns-pixel-popup-menu__item-main
  .ns-pixel-icon {
  animation-duration: 520ms;
}

@keyframes ns-pixel-menu-icon-step {
  0%,
  100% {
    filter: none;
    transform: translate(0, 0);
  }

  50% {
    filter: drop-shadow(2px 2px 0 rgba(42, 33, 56, 0.18));
    transform: translate(-1px, -2px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .ns-pixel-menu-popup--animated-icons .ns-pixel-icon {
    animation: none;
  }
}

.ns-pixel-icon-lab {
  margin-bottom: 30px;
}

.ns-pixel-icon-lab__grid {
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.15fr) minmax(260px, 0.9fr);
  gap: 14px;
  min-width: 0;
}

.ns-pixel-icon-lab__panel {
  display: grid;
  align-content: start;
  min-width: 0;
  gap: 12px;
  padding: 12px;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-pixel-surface);
}

.ns-pixel-icon-text-bar {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px;
  border: 2px solid var(--ns-pixel-border);
  background:
    linear-gradient(90deg, rgba(255, 124, 194, 0.14), rgba(94, 220, 235, 0.14)),
    var(--ns-pixel-surface);
  box-shadow: 3px 3px 0 var(--ns-pixel-shadow);
}

.ns-pixel-icon-text-bar__brand,
.ns-pixel-icon-text-bar__button {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding: 0 10px;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-pixel-surface);
  color: var(--ns-pixel-ink);
  font-family: var(--ns-pixel-font);
  font-size: 12px;
  font-weight: 900;
  text-decoration: none;
  box-shadow: 2px 2px 0 rgba(42, 33, 56, 0.14);
}

.ns-pixel-icon-text-bar__brand {
  flex: 1 1 260px;
  max-width: 420px;
}

.ns-pixel-icon-text-bar__actions {
  display: flex;
  flex: 0 1 auto;
  min-width: 0;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.ns-pixel-icon-text-bar__button {
  flex: 0 0 auto;
  min-width: 112px;
  cursor: pointer;
}

.ns-pixel-icon-text-bar__button--active,
.ns-pixel-icon-text-bar__button--blue {
  background: var(--ns-pixel-surface-blue);
}

.ns-pixel-icon-text-bar__button--pink {
  background: var(--ns-pixel-surface-pink);
}

.ns-pixel-icon-text-bar__label {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.ns-pixel-icon-text-bar__command {
  flex: 0 0 auto;
  margin-left: auto;
  color: var(--ns-pixel-muted);
  font-size: 10px;
}

.ns-pixel-icon-lab__button-row,
.ns-pixel-icon-lab__text-button-row {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  gap: 10px;
}

.ns-pixel-icon-button {
  display: inline-grid;
  flex: 0 0 auto;
  width: 42px;
  height: 42px;
  place-items: center;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-pixel-surface);
  color: var(--ns-pixel-ink);
  cursor: pointer;
  box-shadow: 3px 3px 0 var(--ns-pixel-shadow);
  transition:
    transform var(--ns-transition-fast),
    box-shadow var(--ns-transition-fast),
    background var(--ns-transition-fast);
}

.ns-pixel-icon-button:hover {
  transform: translate(-1px, -1px);
  box-shadow: 4px 4px 0 var(--ns-pixel-shadow);
}

.ns-pixel-icon-button:active {
  transform: translate(2px, 2px);
  box-shadow: 1px 1px 0 var(--ns-pixel-shadow);
}

.ns-pixel-icon-button--pink {
  background: var(--ns-pixel-surface-pink);
}

.ns-pixel-icon-button--blue {
  background: var(--ns-pixel-surface-blue);
}

.ns-pixel-icon {
  display: inline-block;
  flex: 0 0 auto;
  width: 22px;
  height: 22px;
  background: currentColor;
  image-rendering: pixelated;
  mask: var(--ns-pixel-icon-url) center / 100% 100% no-repeat;
  -webkit-mask: var(--ns-pixel-icon-url) center / 100% 100% no-repeat;
}

.ns-pixel-icon-menu {
  gap: 8px;
}

.ns-pixel-icon-menu__item {
  appearance: none;
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 38px;
  padding: 0 10px;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-pixel-surface);
  color: var(--ns-pixel-ink);
  font-family: var(--ns-pixel-font);
  font-size: 12px;
  font-weight: 900;
  text-decoration: none;
  box-shadow: 2px 2px 0 rgba(42, 33, 56, 0.14);
  cursor: pointer;
}

.ns-pixel-icon-menu__item--active {
  background: var(--ns-pixel-surface-blue);
}

.ns-pixel-icon-menu__main {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
}

.ns-pixel-icon-menu__main span:last-child,
.ns-pixel-icon-menu__item > span:last-child {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.ns-pixel-icon-menu__children {
  display: grid;
  gap: 6px;
  padding-left: 18px;
}

.ns-pixel-icon-menu__child {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  min-height: 34px;
  padding: 0 10px;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-pixel-surface-pink);
  color: var(--ns-pixel-ink);
  font-family: var(--ns-pixel-font);
  font-size: 11px;
  font-weight: 900;
  text-decoration: none;
  box-shadow: 2px 2px 0 rgba(42, 33, 56, 0.14);
}

.ns-pixel-icon-menu__child-main {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
}

.ns-pixel-icon-menu__child-icon {
  flex: 0 0 auto;
  width: 12px;
  height: 12px;
  color: var(--ns-pixel-muted);
}

.ns-pixel-icon-lab__source {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  gap: 8px;
}

.ns-pixel-desktop-lab {
  overflow: hidden;
  margin-bottom: 30px;
}

.ns-pixel-desktop-preview {
  position: relative;
  overflow: hidden;
  min-height: 660px;
  padding: 18px 18px 62px;
  border-top: 2px solid var(--ns-pixel-border);
  background:
    radial-gradient(circle at 18% 16%, rgba(255, 124, 194, 0.18), transparent 28%),
    radial-gradient(circle at 84% 26%, rgba(94, 220, 235, 0.2), transparent 30%),
    linear-gradient(135deg, rgba(255, 246, 252, 0.96), rgba(240, 253, 255, 0.98));
}

.ns-pixel-desktop-preview__grid {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(255, 124, 194, 0.08) 1px, transparent 1px),
    linear-gradient(0deg, rgba(94, 220, 235, 0.08) 1px, transparent 1px);
  background-size: 18px 18px;
  pointer-events: none;
}

.ns-pixel-desktop-icons {
  position: relative;
  z-index: 3;
  display: grid;
  width: 88px;
  gap: 10px;
}

.ns-pixel-desktop-icon {
  display: grid;
  min-width: 0;
  justify-items: center;
  gap: 5px;
  padding: 7px 4px;
  border: 2px solid transparent;
  color: var(--ns-pixel-ink);
  font-family: var(--ns-pixel-font);
  font-size: 11px;
  font-weight: 900;
  line-height: 1.2;
  text-align: center;
  text-decoration: none;
}

.ns-pixel-desktop-icon:hover,
.ns-pixel-desktop-icon:focus-visible {
  border-color: var(--ns-pixel-border);
  background: rgba(255, 255, 255, 0.72);
  outline: 0;
}

.ns-pixel-desktop-icon__image {
  position: relative;
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  padding: 8px;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-pixel-surface-pink);
  color: var(--ns-pixel-ink);
  box-shadow: 3px 3px 0 var(--ns-pixel-shadow);
  mask: none;
  -webkit-mask: none;
}

.ns-pixel-desktop-icon__image::before {
  display: block;
  width: 22px;
  height: 22px;
  background: currentColor;
  content: '';
  mask: var(--ns-pixel-icon-url) center / 100% 100% no-repeat;
  -webkit-mask: var(--ns-pixel-icon-url) center / 100% 100% no-repeat;
}

.ns-pixel-desktop-icon:nth-child(even) .ns-pixel-desktop-icon__image {
  background: var(--ns-pixel-surface-blue);
}

.ns-pixel-desktop-icon__label {
  display: -webkit-box;
  overflow: hidden;
  max-width: 78px;
  min-height: 26px;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.ns-pixel-desktop-window {
  position: absolute;
  z-index: 4;
  display: grid;
  min-width: 0;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-pixel-surface);
  box-shadow: 6px 6px 0 var(--ns-pixel-shadow);
}

.ns-pixel-desktop-window--main {
  top: 86px;
  right: 238px;
  bottom: 40px;
  left: 172px;
  z-index: 4;
  grid-template-rows: auto minmax(0, 1fr);
  overflow: visible;
}

.ns-pixel-desktop-window--tools {
  top: 70px;
  right: 28px;
  z-index: 5;
  width: 320px;
}

.ns-pixel-desktop-window--status {
  top: 310px;
  right: 54px;
  z-index: 4;
  width: 288px;
}

.ns-pixel-desktop-window--note {
  display: none;
}

.ns-pixel-desktop-window__bar {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
  min-height: 36px;
  padding: 6px 10px;
  border-bottom: 2px solid var(--ns-pixel-border);
  background:
    linear-gradient(90deg, rgba(255, 124, 194, 0.2), rgba(94, 220, 235, 0.2)),
    var(--ns-pixel-surface);
  color: var(--ns-pixel-ink);
  font-family: var(--ns-pixel-font);
  font-size: 12px;
  font-weight: 900;
}

.ns-pixel-desktop-window__bar--blue {
  background: var(--ns-pixel-surface-blue);
}

.ns-pixel-desktop-window__bar--pink {
  background: var(--ns-pixel-surface-pink);
}

.ns-pixel-desktop-window__bar > span:nth-child(2) {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.ns-pixel-desktop-window__controls {
  display: inline-flex;
  flex: 0 0 auto;
  gap: 4px;
  margin-left: auto;
}

.ns-pixel-desktop-window__controls span {
  width: 16px;
  height: 16px;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-pixel-surface);
}

.ns-pixel-desktop-window__body {
  display: grid;
  gap: 10px;
  min-width: 0;
  padding: 14px;
}

.ns-pixel-desktop-window__body--main {
  position: relative;
  overflow: visible;
  height: 100%;
  min-height: 0;
  padding: 0;
  background:
    linear-gradient(90deg, rgba(255, 124, 194, 0.08) 1px, transparent 1px),
    linear-gradient(0deg, rgba(94, 220, 235, 0.08) 1px, transparent 1px),
    linear-gradient(135deg, rgba(255, 246, 252, 0.94), rgba(240, 253, 255, 0.98));
  background-size:
    16px 16px,
    16px 16px,
    auto;
}

.ns-pixel-desktop-portrait {
  position: absolute;
  right: 18px;
  bottom: -96px;
  left: 18px;
  z-index: 2;
  overflow: visible;
  min-height: calc(100% + 96px);
  border: 0;
  background:
    radial-gradient(circle at 50% 74%, rgba(94, 220, 235, 0.18), transparent 34%),
    radial-gradient(circle at 48% 44%, rgba(255, 124, 194, 0.14), transparent 30%);
  pointer-events: none;
}

.ns-pixel-desktop-portrait::before,
.ns-pixel-desktop-portrait::after,
.ns-pixel-desktop-portrait span {
  position: absolute;
  content: '';
}

.ns-pixel-desktop-portrait::before {
  top: auto;
  bottom: -8px;
  left: 50%;
  width: min(82%, 640px);
  height: min(134%, 720px);
  background:
    var(--style-lab-character-art-url, none) center bottom / contain no-repeat,
    linear-gradient(180deg, transparent 0 28%, var(--ns-pixel-surface-pink) 28% 42%, var(--ns-pixel-surface-blue) 42% 100%);
  filter:
    drop-shadow(8px 8px 0 rgba(42, 33, 56, 0.18))
    drop-shadow(-3px 0 0 rgba(255, 124, 194, 0.24))
    drop-shadow(3px 0 0 rgba(94, 220, 235, 0.22));
  transform: translateX(-50%);
}

.ns-pixel-desktop-portrait::after {
  right: 8%;
  bottom: 56px;
  left: 8%;
  height: 2px;
  background: repeating-linear-gradient(
    90deg,
    rgba(255, 124, 194, 0.72) 0 9px,
    rgba(94, 220, 235, 0.72) 9px 18px,
    transparent 18px 26px
  );
  opacity: 0.72;
}

.ns-pixel-desktop-portrait span {
  right: 12%;
  bottom: 38px;
  left: 50%;
  width: min(68%, 500px);
  height: 1px;
  background: var(--ns-pixel-border);
  opacity: 0.38;
  transform: translateX(-50%);
}

.ns-pixel-desktop-copy {
  position: absolute;
  top: 28px;
  left: 30px;
  z-index: 3;
  display: grid;
  min-width: 0;
  max-width: min(360px, 48%);
  gap: 10px;
  padding: 14px;
  border: 2px solid var(--ns-pixel-border);
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 4px 4px 0 rgba(42, 33, 56, 0.14);
  backdrop-filter: blur(1px);
}

.ns-pixel-desktop-copy h2 {
  margin: 0;
  color: var(--ns-pixel-ink);
  font-family: var(--ns-font-display);
  font-size: clamp(28px, 4vw, 52px);
  line-height: 1;
  letter-spacing: 0;
  text-shadow:
    2px 2px 0 var(--ns-pixel-surface-blue),
    4px 4px 0 rgba(255, 124, 194, 0.22);
}

.ns-pixel-desktop-copy p {
  margin: 0;
  color: var(--ns-pixel-muted);
  font-size: 13px;
  line-height: 1.7;
}

.ns-pixel-desktop-copy__actions {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  gap: 8px;
}

.ns-pixel-desktop-copy__actions .ns-pixel-button {
  text-decoration: none;
}

.ns-pixel-desktop-tool {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
  min-height: 42px;
  padding: 0 10px;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-pixel-surface);
  color: var(--ns-pixel-ink);
  font-family: var(--ns-pixel-font);
  font-size: 12px;
  font-weight: 900;
  text-decoration: none;
  box-shadow: 2px 2px 0 rgba(42, 33, 56, 0.14);
}

.ns-pixel-desktop-tool:hover,
.ns-pixel-desktop-tool:focus-visible {
  background: var(--ns-pixel-surface-pink);
  outline: 0;
  transform: translate(-1px, -1px);
}

.ns-pixel-desktop-status-row {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: var(--ns-pixel-ink);
  font-family: var(--ns-pixel-font);
  font-size: 12px;
  font-weight: 900;
}

.ns-pixel-desktop-status-row strong {
  color: var(--ns-pixel-pink);
  font-size: 11px;
}

.ns-pixel-desktop-meter {
  height: 16px;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-pixel-surface);
}

.ns-pixel-desktop-meter span {
  display: block;
  width: var(--desktop-meter);
  height: 100%;
  background: repeating-linear-gradient(
    90deg,
    var(--ns-pixel-surface-blue) 0 8px,
    var(--ns-pixel-pink) 8px 12px
  );
}

.ns-pixel-desktop-note-row {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 30px;
  padding: 0 8px;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-pixel-surface);
  color: var(--ns-pixel-ink);
  font-family: var(--ns-pixel-font);
  font-size: 11px;
  font-weight: 900;
}

.ns-pixel-desktop-note-row strong {
  overflow: hidden;
  color: var(--ns-pixel-muted);
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ns-pixel-desktop-taskbar {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 8;
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 5px;
  min-height: 40px;
  padding: 4px 6px;
  border-top: 2px solid var(--ns-pixel-border);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.86), rgba(255, 231, 248, 0.92)),
    var(--ns-pixel-surface-pink);
}

.ns-pixel-desktop-taskbar__start,
.ns-pixel-desktop-taskbar__window,
.ns-pixel-desktop-taskbar__clock {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 6px;
  min-height: 28px;
  padding: 0 8px;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-pixel-surface);
  color: var(--ns-pixel-ink);
  font-family: var(--ns-pixel-font);
  font-size: 11px;
  font-weight: 900;
  text-decoration: none;
  box-shadow:
    inset -2px -2px 0 rgba(42, 33, 56, 0.12),
    inset 2px 2px 0 rgba(255, 255, 255, 0.9);
}

.ns-pixel-desktop-taskbar__start {
  flex: 0 0 auto;
  min-width: 98px;
  padding-inline: 9px 12px;
  background: var(--ns-pixel-surface);
}

.ns-pixel-desktop-taskbar__start .ns-pixel-icon {
  width: 18px;
  height: 18px;
  color: var(--ns-pixel-pink);
}

.ns-pixel-desktop-taskbar__start:hover,
.ns-pixel-desktop-taskbar__start:focus-visible,
.ns-pixel-desktop-taskbar__window:hover,
.ns-pixel-desktop-taskbar__window:focus-visible {
  background: var(--ns-pixel-surface-blue);
  outline: 0;
}

.ns-pixel-desktop-taskbar__separator {
  flex: 0 0 auto;
  width: 2px;
  height: 28px;
  border-left: 2px solid color-mix(in srgb, var(--ns-pixel-border) 55%, transparent);
  border-right: 2px solid rgba(255, 255, 255, 0.84);
}

.ns-pixel-desktop-taskbar__windows {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  align-items: center;
  gap: 4px;
}

.ns-pixel-desktop-taskbar__window {
  flex: 1 1 0;
  max-width: 210px;
  justify-content: flex-start;
}

.ns-pixel-desktop-taskbar__window span:last-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ns-pixel-desktop-taskbar__window--active {
  background: var(--ns-pixel-surface-pink);
  box-shadow:
    inset 2px 2px 0 rgba(42, 33, 56, 0.18),
    inset -2px -2px 0 rgba(255, 255, 255, 0.78);
}

.ns-pixel-desktop-taskbar__dot {
  flex: 0 0 auto;
  width: 12px;
  height: 12px;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-pixel-pink);
}

.ns-pixel-desktop-taskbar__window:nth-child(even) .ns-pixel-desktop-taskbar__dot {
  background: var(--ns-pixel-surface-blue);
}

.ns-pixel-desktop-taskbar__clock {
  flex: 0 0 auto;
  min-width: 112px;
  justify-content: center;
  background: var(--ns-pixel-surface-blue);
}

.ns-pixel-desktop-taskbar__sun {
  position: relative;
  display: inline-block;
  flex: 0 0 auto;
  width: 16px;
  height: 16px;
  border: 2px solid var(--ns-pixel-border);
  background: #ffd95f;
  box-shadow:
    0 -4px 0 -2px #ffd95f,
    0 4px 0 -2px #ffd95f,
    4px 0 0 -2px #ffd95f,
    -4px 0 0 -2px #ffd95f;
}

.style-lab-experiment[data-pixel-tone='cyber-night'] .ns-pixel-desktop-preview {
  background: var(--ns-pixel-cyber-menu-stage-bg);
}

.style-lab-experiment[data-pixel-tone='cyber-night'] .ns-pixel-desktop-preview__grid {
  background:
    linear-gradient(90deg, rgba(255, 95, 184, 0.08) 1px, transparent 1px),
    linear-gradient(0deg, rgba(94, 234, 255, 0.08) 1px, transparent 1px);
}

.style-lab-experiment[data-pixel-tone='cyber-night'] .ns-pixel-desktop-icon:hover,
.style-lab-experiment[data-pixel-tone='cyber-night'] .ns-pixel-desktop-icon:focus-visible {
  background: rgba(13, 16, 24, 0.78);
  box-shadow: 3px 3px 0 rgba(5, 9, 18, 0.58);
}

.style-lab-experiment[data-pixel-tone='cyber-night'] .ns-pixel-desktop-window {
  background: var(--ns-pixel-surface);
  box-shadow: var(--ns-pixel-cyber-panel-shadow);
}

.style-lab-experiment[data-pixel-tone='cyber-night'] .ns-pixel-desktop-window__bar {
  background: var(--ns-pixel-cyber-chrome-bg);
  color: var(--ns-pixel-neon-white);
  text-shadow: var(--ns-pixel-cyber-chrome-shadow);
}

.style-lab-experiment[data-pixel-tone='cyber-night'] .ns-pixel-desktop-window__bar--blue {
  background: var(--ns-pixel-cyber-card-blue-bg);
}

.style-lab-experiment[data-pixel-tone='cyber-night'] .ns-pixel-desktop-window__bar--pink {
  background: var(--ns-pixel-cyber-card-bg);
}

.style-lab-experiment[data-pixel-tone='cyber-night'] .ns-pixel-desktop-window__controls span {
  background: var(--ns-pixel-window-control-bg);
  box-shadow: var(--ns-pixel-window-control-shadow);
}

.style-lab-experiment[data-pixel-tone='cyber-night'] .ns-pixel-desktop-window__body--main {
  background:
    linear-gradient(90deg, rgba(255, 95, 184, 0.08) 1px, transparent 1px),
    linear-gradient(0deg, rgba(94, 234, 255, 0.08) 1px, transparent 1px),
    var(--ns-pixel-cyber-recessed-bg);
}

.style-lab-experiment[data-pixel-tone='cyber-night'] .ns-pixel-desktop-portrait {
  background:
    radial-gradient(circle at 50% 74%, rgba(94, 234, 255, 0.16), transparent 34%),
    radial-gradient(circle at 48% 44%, rgba(255, 95, 184, 0.14), transparent 30%);
}

.style-lab-experiment[data-pixel-tone='cyber-night'] .ns-pixel-desktop-copy {
  background:
    linear-gradient(180deg, rgba(255, 95, 184, 0.08), rgba(13, 16, 24, 0) 58%),
    rgba(13, 16, 24, 0.9);
  box-shadow: var(--ns-pixel-cyber-ui-shadow);
  backdrop-filter: none;
}

.style-lab-experiment[data-pixel-tone='cyber-night'] .ns-pixel-desktop-copy h2 {
  color: var(--ns-pixel-neon-white);
  text-shadow: var(--ns-pixel-cyber-title-shadow);
}

.style-lab-experiment[data-pixel-tone='cyber-night'] .ns-pixel-desktop-copy p {
  color: var(--ns-pixel-cyber-readable-text);
}

.style-lab-experiment[data-pixel-tone='cyber-night'] .ns-pixel-desktop-tool,
.style-lab-experiment[data-pixel-tone='cyber-night'] .ns-pixel-desktop-note-row {
  background: var(--ns-pixel-cyber-card-bg);
  box-shadow: var(--ns-pixel-cyber-ui-shadow);
}

.style-lab-experiment[data-pixel-tone='cyber-night'] .ns-pixel-desktop-tool:hover,
.style-lab-experiment[data-pixel-tone='cyber-night'] .ns-pixel-desktop-tool:focus-visible {
  background: var(--ns-pixel-cyber-card-blue-bg);
  box-shadow: var(--ns-pixel-cyber-hover-shadow);
}

.style-lab-experiment[data-pixel-tone='cyber-night'] .ns-pixel-desktop-meter {
  background: var(--ns-pixel-cyber-recessed-bg);
}

.style-lab-experiment[data-pixel-tone='cyber-night'] .ns-pixel-desktop-taskbar {
  background: var(--ns-pixel-cyber-chrome-bg);
  box-shadow: 0 -2px 0 rgba(94, 234, 255, 0.1);
}

.style-lab-experiment[data-pixel-tone='cyber-night'] .ns-pixel-desktop-taskbar__start,
.style-lab-experiment[data-pixel-tone='cyber-night'] .ns-pixel-desktop-taskbar__window,
.style-lab-experiment[data-pixel-tone='cyber-night'] .ns-pixel-desktop-taskbar__clock {
  background: var(--ns-pixel-surface);
  box-shadow:
    inset -2px -2px 0 rgba(5, 9, 18, 0.6),
    inset 2px 2px 0 rgba(255, 246, 255, 0.08),
    0 0 10px rgba(94, 234, 255, 0.08);
}

.style-lab-experiment[data-pixel-tone='cyber-night'] .ns-pixel-desktop-taskbar__start:hover,
.style-lab-experiment[data-pixel-tone='cyber-night'] .ns-pixel-desktop-taskbar__start:focus-visible,
.style-lab-experiment[data-pixel-tone='cyber-night'] .ns-pixel-desktop-taskbar__window:hover,
.style-lab-experiment[data-pixel-tone='cyber-night'] .ns-pixel-desktop-taskbar__window:focus-visible {
  background: var(--ns-pixel-cyber-card-blue-bg);
}

.style-lab-experiment[data-pixel-tone='cyber-night'] .ns-pixel-desktop-taskbar__window--active {
  background: var(--ns-pixel-cyber-card-bg);
  box-shadow:
    inset 2px 2px 0 rgba(5, 9, 18, 0.68),
    inset -2px -2px 0 rgba(255, 246, 255, 0.08),
    0 0 12px rgba(255, 95, 184, 0.12);
}

.style-lab-experiment[data-pixel-tone='cyber-night'] .ns-pixel-desktop-taskbar__separator {
  border-left-color: rgba(203, 194, 210, 0.36);
  border-right-color: rgba(94, 234, 255, 0.16);
}

.style-lab-experiment[data-pixel-tone='cyber-night'] .ns-pixel-desktop-taskbar__sun {
  background: var(--ns-pixel-neon-blue);
  box-shadow:
    0 -4px 0 -2px var(--ns-pixel-neon-blue),
    0 4px 0 -2px var(--ns-pixel-neon-blue),
    4px 0 0 -2px var(--ns-pixel-neon-blue),
    -4px 0 0 -2px var(--ns-pixel-neon-blue),
    0 0 12px rgba(94, 234, 255, 0.32);
}

.ns-pixel-notebook-lab {
  overflow: hidden;
  width: max-content;
  min-width: 246px;
  max-width: min(100%, 326px);
  margin-inline: auto;
  margin-bottom: 22px;
}

@media (max-width: 620px) {
  .style-formal-sample {
    padding-top: 24px;
  }

  .style-formal-sample__shell {
    width: min(var(--ns-content-width), calc(100vw - 24px));
  }

  .style-formal-sample__grid,
  .style-formal-sample__states,
  .style-formal-sample__loading {
    grid-template-columns: 1fr;
  }

  .style-common-components__grid {
    grid-template-columns: 1fr;
  }

  .ns-pixel-page-turn-lab__stage {
    grid-template-columns: repeat(2, minmax(126px, 1fr));
    gap: 8px;
    min-height: 96px;
    padding: 10px;
  }

  .ns-pixel-page-turn {
    width: 38px;
    height: 48px;
    padding-inline: 7px;
  }

  .ns-pixel-page-turn:hover,
  .ns-pixel-page-turn:focus-visible {
    width: 132px;
  }

  .ns-pixel-page-turn__arrow {
    width: 18px;
    height: 18px;
  }

  .ns-pixel-page-turn__label {
    width: 78px;
    min-height: 32px;
    font-size: 12px;
  }

  .ns-pixel-page-turn:hover .ns-pixel-page-turn__label,
  .ns-pixel-page-turn:focus-visible .ns-pixel-page-turn__label {
    max-width: 78px;
  }

  .ns-pixel-rail-reflow {
    grid-template-columns: 1fr;
  }

  .ns-pixel-rail-reflow:has(.ns-pixel-rail-reflow__rail:hover),
  .ns-pixel-rail-reflow:has(.ns-pixel-rail-reflow__rail:focus-within) {
    grid-template-columns: 1fr;
  }

  .ns-pixel-rail-reflow__rail {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    align-content: start;
    border-right: 0;
    border-bottom: 2px solid var(--ns-pixel-border);
  }

  .ns-pixel-rail-reflow__item,
  .ns-pixel-rail-reflow__rail:hover .ns-pixel-rail-reflow__item,
  .ns-pixel-rail-reflow__rail:focus-within .ns-pixel-rail-reflow__item {
    grid-template-columns: 22px minmax(0, 1fr);
    justify-content: start;
    justify-items: start;
    gap: 6px;
    width: 100%;
  }

  .ns-pixel-rail-reflow__label,
  .ns-pixel-rail-reflow__rail:hover .ns-pixel-rail-reflow__label,
  .ns-pixel-rail-reflow__rail:focus-within .ns-pixel-rail-reflow__label {
    max-width: none;
    opacity: 1;
  }

  .ns-pixel-rail-reflow__grid {
    grid-template-columns: 1fr;
  }

  .ns-pixel-icon-lab__grid {
    grid-template-columns: 1fr;
  }

  .ns-pixel-icon-text-bar {
    align-items: stretch;
    flex-direction: row;
  }

  .ns-pixel-icon-text-bar__brand {
    flex: 1 1 0;
    max-width: none;
    justify-content: center;
    padding-inline: 0;
  }

  .ns-pixel-icon-text-bar__actions {
    display: grid;
    flex: 2 1 0;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    width: auto;
  }

  .ns-pixel-icon-text-bar__button {
    width: 100%;
    min-width: 0;
    justify-content: center;
    padding-inline: 0;
  }

  .ns-pixel-icon-text-bar__label,
  .ns-pixel-icon-text-bar__command {
    display: none;
  }

  .ns-pixel-icon-lab__text-button-row .ns-pixel-button {
    width: 100%;
  }

  .ns-pixel-desktop-preview {
    display: grid;
    min-height: 0;
    gap: 12px;
    padding: 12px;
  }

  .ns-pixel-desktop-icons {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    width: auto;
    gap: 6px;
  }

  .ns-pixel-desktop-icon {
    padding-inline: 2px;
  }

  .ns-pixel-desktop-icon__image {
    width: 38px;
    height: 38px;
  }

  .ns-pixel-desktop-window {
    position: relative;
    inset: auto;
    width: 100%;
  }

  .ns-pixel-desktop-window--main,
  .ns-pixel-desktop-window--tools,
  .ns-pixel-desktop-window--status,
  .ns-pixel-desktop-window--note {
    top: auto;
    right: auto;
    bottom: auto;
    left: auto;
    width: 100%;
  }

  .ns-pixel-desktop-window__body--main {
    display: grid;
    grid-template-columns: 1fr;
    height: auto;
    min-height: 0;
    gap: 10px;
    padding: 12px;
    overflow: hidden;
  }

  .ns-pixel-desktop-portrait {
    position: relative;
    right: auto;
    bottom: auto;
    left: auto;
    order: 2;
    min-height: 230px;
    overflow: hidden;
    border: 2px solid var(--ns-pixel-border);
  }

  .ns-pixel-desktop-portrait::before {
    bottom: -12px;
    width: min(82%, 260px);
    height: 250px;
  }

  .ns-pixel-desktop-portrait::after {
    bottom: 34px;
  }

  .ns-pixel-desktop-portrait span {
    bottom: 22px;
  }

  .ns-pixel-desktop-copy {
    position: relative;
    top: auto;
    left: auto;
    order: 1;
    max-width: none;
  }

  .ns-pixel-desktop-copy h2 {
    font-size: 42px;
  }

  .ns-pixel-desktop-taskbar {
    position: relative;
    display: grid;
    grid-template-columns: minmax(110px, 1fr) auto;
    align-items: stretch;
    gap: 6px;
    margin: 0 -12px -12px;
  }

  .ns-pixel-desktop-taskbar__start {
    min-width: 0;
    justify-content: center;
  }

  .ns-pixel-desktop-taskbar__separator {
    display: none;
  }

  .ns-pixel-desktop-taskbar__windows {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .ns-pixel-desktop-taskbar__window {
    max-width: none;
    justify-content: center;
  }

  .ns-pixel-desktop-taskbar__clock {
    min-width: 0;
    justify-content: center;
  }
}
</style>
