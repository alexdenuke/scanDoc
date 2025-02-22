import style from "./Header.module.scss";

export default function Header() {
    return <>
    <header className={`${style.header}`} >
            <a href="" className={style.header__logo}>ПодписьОнлайн</a>
        <nav className="header__nav">
            <a href="" className={style.header__navLink}>Как работает</a>
            <a href="" className={style.header__navLink}>Тарифы</a>
            <a href="" className={style.header__navLink}>Калькулятор</a>
            <a href="" className={style.header__navLink}>Примеры документов</a>
            <a href="" className={style.header__navLink}>Поддержка</a>
        </nav>
        <a href="" className={style.header__account}>Личный кабинет</a>
    </header>
    </>;
}