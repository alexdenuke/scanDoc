import style from "./Header.module.scss";
import Image from "next/image";

export default function Header() {
    return <>
        <header className={`${style.header}`} >
            <a href="" className={style.header__logo}>ПодписьОнлайн</a>
            <nav className={style.header__nav}>
                <a href="" className={style.header__navLink}>Как работает</a>
                <a href="" className={style.header__navLink}>Тарифы</a>
                <a href="" className={style.header__navLink}>Калькулятор</a>
                <a href="" className={style.header__navLink}>Примеры документов</a>
                <a href="" className={style.header__navLink}>Поддержка</a>
            </nav>
            <a href="" className={style.header__account}>Личный кабинет</a>
            <Image className={style.burger} src={"/icons/burger.svg"} width={500}
                height={500}
                alt="Picture of the author" />
        </header>
    </>;
}