import style from "./BtnWithArrow.module.scss";
import classNames from "classnames";

interface ButtonProps {
    label: string,
    justify: string,

}

export default function BtnWithArrow({label, justify}:ButtonProps) {
    return (
        <div
        style={{
            justifyContent: justify, // ✅ Передаём `justify-content` как inline-стиль
          }}
        className={style.btnWrap}>
            <button className={style.btn}>{label}</button>
        </div>
        
        

    )
}