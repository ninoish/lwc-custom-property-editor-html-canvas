import { LightningElement, api } from 'lwc';

export default class CustomCanvasPropertyEditor extends LightningElement {
  isInitialized = false;
  canvas = null;
  ctx = null;
  drawstate = 0;
  inputCanvasImage;
  _inputVariables = [];

  @api
  get inputVariables() {
    return this._inputVariables;
  }

  set inputVariables(variables) {
    // 入力変数に対応して、CanvasにBase64の画像を反映
    const param = variables.find(({ name }) => name === "base64image");
    if (param) {
      if (this.ctx && this.canvas) {
        const img = new Image();
        img.src = param.value;
        img.onload = () => {
          this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
        };
      } else {
        this.inputCanvasImage = param.value;
      }
    }
    this._inputVariables = variables || [];
  }


  renderedCallback() {
    if (!this.isInitialized) {
      // Canvas 初期化 & イベントリスナー追加
      const canvas = this.template.querySelector(".canvas");
      canvas.addEventListener("mousedown", this.startDraw, false);
      canvas.addEventListener("mouseup", this.endDraw, false);
      canvas.addEventListener("mousemove", this.onMouseMove, false);

      this.canvas = canvas;
      this.ctx = this.canvas.getContext("2d");
      this.ctx.fillStyle = "#FFF";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      if (this.inputCanvasImage) {
        const img = new Image();
        img.src = this.inputCanvasImage;
        img.onload = () => {
          this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
        };
      }
    }
  }

  startDraw = () => {
    this.drawstate = 1;
  };
  endDraw = () => {
    this.drawstate = 0;
    // 描き終わったら反映
    this.submit();
  };
  onMouseMove = e => {
    if (this.drawstate === 0) {
      return;
    }
    this.draw(e.offsetX, e.offsetY);
  };

  // 描画処理
  draw = (x, y) => {
    this.ctx.lineWidth = 5;
    this.ctx.strokeStyle = "rgba(0, 0, 0, 1)";
    if (this.drawstate === 1) {
      this.drawstate = 2;
      this.ctx.beginPath();
      this.ctx.lineCap = "round";
      this.ctx.moveTo(x, y);
    } else {
      this.ctx.lineTo(x, y);
    }
    this.ctx.stroke();
  };

  // 描画クリア
  onClickClear = () => {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "#FFF";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.submit();
  };

  // Flow Builderに、描いたものをBase64化して文字列で渡す。
  submit = () => {
    const base64 = this.canvas.toDataURL("image/jpeg");
    console.log(base64);
    const valueChangedEvent = new CustomEvent(
      "configuration_editor_input_value_changed",
      {
        bubbles: true,
        cancelable: false,
        composed: true,
        detail: {
          name: "base64image",
          newValue: base64,
          newValueDataType: "String"
        }
      }
    );
    this.dispatchEvent(valueChangedEvent);
  };
}