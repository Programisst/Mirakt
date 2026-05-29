export type Locale = "ru" | "en";

export const translations = {
  ru: {
    // Navbar
    search: "Поиск новостей…",
    login: "Войти",
    cabinet: "Личный кабинет",
    support: "Поддержка",
    logout: "Выйти",
    account: "Аккаунт",

    // Категории
    cat_main:     "ГЛАВНОЕ",
    cat_world:    "МИР",
    cat_russia:   "РОССИЯ",
    cat_crimea:   "КРЫМ",
    cat_economy:  "ЭКОНОМИКА",
    cat_science:  "НАУКА И ТЕХНИКА",
    cat_politics: "ПОЛИТИКА",

    // Лента
    load_more:    "ЗАГРУЗИТЬ ЕЩЁ",
    loading:      "ЗАГРУЗКА…",
    no_data:      "НЕТ ДАННЫХ — КАНАЛ НЕДОСТУПЕН",
    retry:        "ПОВТОРИТЬ",
    not_found:    "НИЧЕГО НЕ НАЙДЕНО",
    end_of_feed:  "КОНЕЦ ЛЕНТЫ",
    from_editors: "ОТ РЕДАКЦИИ",
    read_more:    "ЧИТАТЬ →",
    new_articles: (n: number) => `↑ ${n} новых ${n === 1 ? "материал" : n < 5 ? "материала" : "материалов"}`,

    // Статья
    back:         "Назад",
    read_full:    "Читать полностью",
    all_news:     "← Все новости",
    aggregator:   "Mirakt — агрегатор новостей",

    // Auth
    auth_login:       "Вход",
    auth_register:    "Регистрация",
    auth_no_account:  "Нет аккаунта?",
    auth_has_account: "Уже есть аккаунт?",
    auth_sign_in:     "Войти →",
    auth_sign_up:     "Зарегистрироваться →",
    auth_email:       "EMAIL",
    auth_password:    "ПАРОЛЬ",
    auth_confirm:     "ПОДТВЕРЖДЕНИЕ ПАРОЛЯ",
    auth_agree:       "Соглашаюсь с",
    auth_terms:       "условиями",
    auth_and:         "и",
    auth_privacy:     "политикой конфиденциальности",
    auth_check_email: "Проверьте почту",

    // Кабинет
    cab_title:    "Личный кабинет",
    cab_account:  "Аккаунт",
    cab_settings: "Настройки",
    cab_email:    "Email",
    cab_joined:   "Дата регистрации",
    cab_verified: "Верифицирован",
    cab_change_pw:"Сменить пароль",
    cab_logout:   "Выйти из аккаунта",
    cab_change:   "Изменить",
    cab_set_nick: "Задать ник",
    cab_save:     "Сохранить",

    // Валюты
    cur_usd: "Доллар",
    cur_eur: "Евро",
    cur_cny: "Юань",
    cur_try: "Лира",
    cur_aed: "Дирхам ОАЭ",

    // Кабинет (дополнительно)
    cab_status:           "Статус",
    cab_verified_label:   "Верифицирован",
    cab_new_password:     "Новый пароль",
    cab_confirm_password: "Подтвердите пароль",
    cab_password_updated: "✓ Пароль обновлён",
    cab_min_chars:        "Минимум 6 символов",
    cab_pw_mismatch:      "Пароли не совпадают",
    cab_images_only:      "Только изображения",
    cab_max_size:         "Максимум 5 МБ",
    cab_username_hint:    "Ник",
    auth_repeat_password: "Повторите пароль",

    // Footer
    about:        "О НАС",
    contacts:     "КОНТАКТЫ",
    privacy:      "КОНФИДЕНЦИАЛЬНОСТЬ",
    terms:        "УСЛОВИЯ ИСПОЛЬЗОВАНИЯ",
  },

  en: {
    // Navbar
    search: "Search news...",
    login: "Sign in",
    cabinet: "My Account",
    support: "Support",
    logout: "Sign out",
    account: "Account",

    // Categories
    cat_main:     "MAIN",
    cat_world:    "WORLD",
    cat_russia:   "RUSSIA",
    cat_crimea:   "CRIMEA",
    cat_economy:  "ECONOMY",
    cat_science:  "SCIENCE & TECH",
    cat_politics: "POLITICS",

    // Feed
    load_more:    "LOAD MORE",
    loading:      "LOADING…",
    no_data:      "NO DATA — FEED UNAVAILABLE",
    retry:        "RETRY",
    not_found:    "NOTHING FOUND",
    end_of_feed:  "END OF FEED",
    from_editors: "FROM EDITORS",
    read_more:    "READ →",
    new_articles: (n: number) => `↑ ${n} new ${n === 1 ? "article" : "articles"}`,

    // Article
    back:         "Back",
    read_full:    "Read full article",
    all_news:     "← All news",
    aggregator:   "Mirakt — news aggregator",

    // Auth
    auth_login:       "Sign In",
    auth_register:    "Sign Up",
    auth_no_account:  "No account?",
    auth_has_account: "Already have an account?",
    auth_sign_in:     "Sign In →",
    auth_sign_up:     "Sign Up →",
    auth_email:       "EMAIL",
    auth_password:    "PASSWORD",
    auth_confirm:     "CONFIRM PASSWORD",
    auth_agree:       "I agree to the",
    auth_terms:       "terms of use",
    auth_and:         "and",
    auth_privacy:     "privacy policy",
    auth_check_email: "Check your email",

    // Cabinet
    cab_title:    "My Account",
    cab_account:  "Account",
    cab_settings: "Settings",
    cab_email:    "Email",
    cab_joined:   "Member since",
    cab_verified: "Verified",
    cab_change_pw:"Change password",
    cab_logout:   "Sign out",
    cab_change:   "Change",
    cab_set_nick: "Set username",
    cab_save:     "Save",

    // Currencies
    cur_usd: "Dollar",
    cur_eur: "Euro",
    cur_cny: "Yuan",
    cur_try: "Lira",
    cur_aed: "UAE Dirham",

    // Cabinet (extra)
    cab_status:           "Status",
    cab_verified_label:   "Verified",
    cab_new_password:     "New password",
    cab_confirm_password: "Confirm password",
    cab_password_updated: "✓ Password updated",
    cab_min_chars:        "Minimum 6 characters",
    cab_pw_mismatch:      "Passwords don't match",
    cab_images_only:      "Images only",
    cab_max_size:         "Max 5 MB",
    cab_username_hint:    "Username",
    auth_repeat_password: "Repeat password",

    // Footer
    about:        "ABOUT",
    contacts:     "CONTACTS",
    privacy:      "PRIVACY POLICY",
    terms:        "TERMS OF USE",
  },
};

export type TranslationKey = keyof typeof translations.ru;
export type T = typeof translations.ru;
