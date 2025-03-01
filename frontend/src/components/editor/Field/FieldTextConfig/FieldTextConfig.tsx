import Image from "next/image";
import { PlacedText } from "../..";
import styles from "./FieldTextConfig.module.scss";
import { useState } from "react";
import { ChromePicker } from "react-color";

interface FieldTextConfigProps {
  text: PlacedText;
  onUpdate: (props: Partial<PlacedText>) => void;
}

const fontFamilies = [
  "Arial",
  "Times New Roman",
  "Courier New",
  "Verdana",
  "Georgia",
];
const fontSizes = ["12px", "14px", "16px", "18px", "24px", "32px"];

const FieldTextConfig = ({ text, onUpdate }: FieldTextConfigProps) => {
  const [fontFamily, setFontFamily] = useState(text.fontFamily || "Arial");
  const [fontSize, setFontSize] = useState(text.fontSize || "16px");
  const [color, setColor] = useState(text.color || "#000000");
  const [isBold, setIsBold] = useState(text.isBold || false);
  const [isItalic, setIsItalic] = useState(text.isItalic || false);
  const [textAlign, setTextAlign] = useState(text.textAlign || "left");

  const [displayColorPicker, setDisplayColorPicker] = useState(false);

  const handleFontFamilyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setFontFamily(val);
    onUpdate({ fontFamily: val });
  };

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setFontSize(val);
    const numericSize = parseFloat(val);
    onUpdate({ fontSize: val, originalFontSize: numericSize });
  };

  const handleColorChange = (c: { hex: string }) => {
    setColor(c.hex);
    onUpdate({ color: c.hex });
  };

  const toggleBold = () => {
    const val = !isBold;
    setIsBold(val);
    onUpdate({ isBold: val });
  };

  const toggleItalic = () => {
    const val = !isItalic;
    setIsItalic(val);
    onUpdate({ isItalic: val });
  };

  const handleAlignChange = (align: "left" | "center" | "right") => {
    setTextAlign(align);
    onUpdate({ textAlign: align });
  };

  const handleColorSwatchClick = () => {
    setDisplayColorPicker(!displayColorPicker);
  };

  const handleColorPickerClose = () => {
    setDisplayColorPicker(false);
  };

  return (
    <div className={styles.config}>
      <div className={styles.config__item}>
        <select value={fontFamily} onChange={handleFontFamilyChange}>
          {fontFamilies.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.config__item}>
        <select value={fontSize} onChange={handleFontSizeChange}>
          {fontSizes.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div
        className={styles.config__item}
        onClick={handleColorSwatchClick}
        style={{ cursor: "pointer" }}
      >
        <label>A</label>
        <div
          style={{
            width: "100%",
            height: "4px",
            background: color,
          }}
        />
        {displayColorPicker && (
          <div style={{ position: "absolute", zIndex: 2 }}>
            <div
              style={{
                position: "fixed",
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
              }}
              onClick={handleColorPickerClose}
            />
            <ChromePicker color={color} onChangeComplete={handleColorChange} />
          </div>
        )}
      </div>
      <div className={styles.config__item}>
        <div className={styles.config__itemContent}>
          <button onClick={toggleBold} className={styles.config__itemButton}>
            B
          </button>
          <button onClick={toggleItalic} className={styles.config__itemButton}>
            I
          </button>
        </div>
      </div>
      <div className={styles.config__item}>
        <div className={styles.config__itemContent}>
          <button onClick={() => handleAlignChange("left")}>
            <Image
              src="/img/icons/hor-align-left.svg"
              alt="alignment"
              width={24}
              height={24}
            />
          </button>
          <button onClick={() => handleAlignChange("center")}>
            <Image
              src="/img/icons/hor-align-center.svg"
              alt="alignment"
              width={24}
              height={24}
            />
          </button>
          <button onClick={() => handleAlignChange("right")}>
            <Image
              src="/img/icons/hor-align-right.svg"
              alt="alignment"
              width={24}
              height={24}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FieldTextConfig;
