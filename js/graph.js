/// <reference path="../index.d.ts" />
const snap = (x, factor) => Math.round(x / factor) * factor;
const inverseLerp = (min, max, v) => (v - min) / (max - min);


class Graph {
	/** @param {GraphData} data */
	constructor(data) {
		this.datapoints = data.datapoints;
		this.onValue = data.onValue;
		this.onCancel = data.onCancel;
		this.minmax = data.minmax ?? [];
		if (!data.minmax) this.computeMinMax();
		
		data.style = data.style ?? {};
		const style = this.style = data.style;

		style.strokeWidth = style.strokeWidth ?? 1;
		style.padding = style.padding ?? 1;
		style.lineSize = style.lineSize ?? 1;
		style.lineColor = style.lineColor ?? '#ff6996';
		style.strokeColor = style.strokeColor ?? '#ff6996';
		style.fillColor = style.fillColor ?? '#ff699622';

		this.width = data.width ?? 200;
		this.height = data.height ?? 200;

		this.node = document.createElement('div');
		this.node.classList.add('graph');
		this.node.style.width = 'fit-content';

		this.svgStroke = new SVGShape().fill(0);
		this.svgFill = new SVGShape().fill(0);
		this.svgOverlay = new SVGShape();
		this.svgStroke.node.classList.add('graphStroke');
		this.svgFill.node.classList.add('graphFill');
		this.svgOverlay.node.classList.add('graphLine');

		this.svgContainer = new SVGShapeContainer(this.width, this.height)
		.add(this.svgStroke, this.svgFill, this.svgOverlay)

		this.node.append(this.svgContainer.node);

		this.node.style.width = this.width + 'px';
		this.node.style.height = this.height + 'px';

		
		let _oldIndex = -1;
		
		this.node.addEventListener('mouseenter', e => {
			const data = this.updateContextualLine(e);
			_oldIndex = data.index;
			this?.onValue?.(data);
		});
		this.node.addEventListener('mousemove', e => {
			const data = this.updateContextualLine(e);
			const tempIndex = data.index;
			if (tempIndex == _oldIndex) return;

			_oldIndex = tempIndex;
			this?.onValue?.(data);
		} );
		this.node.addEventListener('mouseleave', () => {
			this.svgOverlay.clear();
			this?.onCancel?.();
		});
		
		this.extendStyle(style);
		this.update();
	}
	computeMinMax() {
		if (typeof this.minmax != 'object') this.minmax = [];
		
		this.minmax[0] = Math.min(...this.datapoints);
		this.minmax[1] = Math.max(...this.datapoints);
		return this;
	}
	/** @param {GraphStyleData} data */
	extendStyle(data) {
		['strokeWidth','padding','lineSize','lineColor','strokeColor','fillColor']
		.forEach(key => {
			this.style[key] = data[key] ?? this.style[key];
		});
		this.svgContainer.setPadding(this.style.padding);

		this.svgStroke.stroke(this.style.strokeColor).strokeWidth(this.style.strokeWidth);
		this.svgFill.fill(this.style.fillColor);
		
		this.svgOverlay.fill(this.style.lineColor);
	}
	/** @param {MouseEvent} event */
	updateContextualLine(event) {
		const length = this.datapoints.length - 1;
		const factor = this.width / length;

		const smallOffset = 0.5 - this.style.padding/2;
		const sampledOffsetPercentage = (event.offsetX/this.width - smallOffset) / this.style.padding;
		const sampledOffset = Math.min(Math.max(sampledOffsetPercentage, 0), 1) * this.width;

		const x = Math.floor(snap(sampledOffset, factor));
		const i = Math.round(sampledOffset / this.width * length);
		const y = this.yOf(i);

		const size = this.style.lineSize / 2;
		const r = 4*size;
		
		const xLeft = x - size;
		const xRight = x + size;
		const yToFirst = y - r;

		const yFromSec = y + r;
		const yToSec = this.height;

		this.svgOverlay
		.clear()
		.forceAbsoulte(true)
		.moveTo(xLeft, 0).lineTo(xRight, 0).lineTo(xRight, yToFirst).lineTo(xLeft, yToFirst)
		.close()
		.moveTo(xLeft, yFromSec).lineTo(xRight, yFromSec).lineTo(xRight, yToSec).lineTo(xLeft, yToSec)
		.close()
		.forceAbsoulte(false)
		.circle(x, y, r, r, false);


		return {value: this.datapoints[i], offset: sampledOffsetPercentage, index: i}
	}
	yOf(i) {
		return this.height - inverseLerp(
			this.minmax[0],
			this.minmax[1],
			this.datapoints[i]
		) * this.height;
	}
	update() {
		this.svgStroke.clear();
		this.svgFill.clear();

		const length = this.datapoints.length - 1;

		for (let i = 0; i <= length; i++) {
			const x = i / length * this.width;
			const y = this.yOf(i);
			
			if (i == 0) {
				this.svgStroke.moveTo(x, y);
				this.svgFill.moveTo(x, y);
			} else {
				this.svgStroke.lineTo(x, y, false);
				this.svgFill.lineTo(x, y, false);
			}

		}
		this.svgFill.lineTo(this.width, this.height, false);
		this.svgFill.lineTo(0, this.height, false);

		// 0 sized circle that keeps the the height of the container constant
		this.svgFill.circle(0,0, 0, 0, false);
	}
}