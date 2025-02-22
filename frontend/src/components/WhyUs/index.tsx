import style from "./WhyUs.module.scss";

export default function WhyUs() {
    return (
        <section className={style.whyUs}>
            <h2 className={style.title}>Почему нас выбирают</h2>
            <div className={style.advantagesWrap}>
                <img className={style.printIcon} src="/img/whyUsPrint.png" alt="Иконка" />
                {/* <ul className={style.advantageItemsWrap}>
                    <li className={style.advantageItem}>Качественная электронная печать и подпись документов</li>
                    <li className={style.advantageItem}>Добавление текста или изображений к документам</li>
                    <li className={style.advantageItem}>Безопасное хранение документов, защита персональных данных</li>
                    <li className={style.advantageItem}>Интеграция с популярными сервисами (Google Drive, Dropbox и др.)</li>
                    <li className={style.advantageItem}>Доступ с любого устройства и доступный интерфейс</li>
                </ul> */}
            </div>
        </section>

    )
}