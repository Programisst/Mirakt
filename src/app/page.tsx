import { HomeClient } from "./HomeClient";

// Кэшируем HTML-оболочку страницы на CDN на 60 секунд.
// Контент всё равно подгружается клиентски, но первый байт придёт из кэша — быстрее.
export const revalidate = 60;

export default function Page() {
  return <HomeClient />;
}
