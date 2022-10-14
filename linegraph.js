/**
 * https://github.com/Malik12tree/LineGraph.js
 * @author Malik12tree
 */
;(function() {


const xmlns = "http://www.w3.org/2000/svg";

class SVGShapeContainer {
	constructor(width, height) {
		this.node = document.createElementNS(xmlns, "svg");
		this.groupNode = document.createElementNS(xmlns, "g");

		this.node.append(this.groupNode);

		this.setSize(width, height);
	}
	setPadding(paddingInPercent) {
		const g = this.groupNode;
		
		if (paddingInPercent != 1) {
			g.setAttributeNS(null, 'transform', `scale(${paddingInPercent})`);
			g.setAttributeNS(null, 'transform-origin', 'center');
			return this;
		}
		g.removeAttributeNS(null, 'transform');
		g.removeAttributeNS(null, 'transform-origin');
		return this;
	}
	setSize(width, height) {
		this.width = width;
		this.height = height;

		this.node.setAttributeNS(null, "viewBox", "0 0 " + width + " " + height);
		this.node.setAttributeNS(null, "width", width);
		this.node.setAttributeNS(null, "height", height);
	}
	add(...svgshapes) {
		svgshapes.forEach(shape => {
			this.groupNode.append(shape.node ?? shape);
		});

		return this;
	}
}
class SVGShape {
	constructor() {
		let scopedPath = '';
		Object.defineProperty(this, 'path',{
			enumerable: true,
			get() {
				return scopedPath;
			},
			set(value) {
				scopedPath = value;
				this.attr('d', value);
			}
		});

		this.absoulteForced = false;

		this.node = document.createElementNS(xmlns, "path");
	}
	forceAbsoulte(v) {
		this.absoulteForced = v;
		return this;
	}
	clear() { 
		this.path = '';
		return this;
	}
	attr(idNS, value) {
		this.node.setAttributeNS(null, idNS, value);
		return this;
	}
	stroke(color) {
		if (color == '0') color = 'transparent';
		return this.attr('stroke', color);
	}
	strokeWidth(value) {
		return this.attr('stroke-width', value);
	}
	fill(color) {
		if (color == '0') color = 'transparent';
		return this.attr('fill', color);
	}

	command(name, relative, ...params) {
		if (this.absoulteForced) relative = false;
		
		name = relative ? name : name.toUpperCase();

		if (this.path != '') this.path += ' ';

		if (0 in params) {
			this.path += name + ' ' + params.join(' ');
		} else {
			this.path += name;
		}
		return this;
	}
	close() {
		return this.command('z', false);
	}

	moveTo(x, y, relative = true) {
		return this.command('m', relative, x, y);
	}
	lineTo(x, y, relative = true) {
		return this.command('l', relative, x, y);
	}
	lineToHorizontal(x, relative = true) {
		return this.command('h', relative, x);
	}
	lineToVertical(y, relative = true) {
		return this.command('v', relative, y);
	}

	//
	cubicBezier(
		startX, startY,
		controlPoint1X, controlPoint1Y,
		controlPoint2X, controlPoint2Y,
		endX, endY,
		relative = true
	) {

		this.moveTo(startX, startY, relative);
		return this.command('c', relative, controlPoint1X, controlPoint1Y, controlPoint2X, controlPoint2Y, endX, endY);
	}
	smoothCubicBezier(
		startX, startY,
		controlPoint2X, controlPoint2Y,
		endX, endY,
		relative = true
	) {

		this.moveTo(startX, startY, relative);
		return this.command('s', relative, controlPoint2X, controlPoint2Y, endX, endY);
	}

	//
	quadraticBezier(
		startX, startY,
		controlPointX, controlPointY,
		endX, endY,
		relative = true
	) {

		this.moveTo(startX, startY, relative);
		return this.command('q', relative, controlPointX, controlPointY, endX, endY);
	}
	smoothQuadraticBezier(
		startX, startY,
		endX, endY,
		relative = true
	) {

		this.moveTo(startX, startY, relative);
		return this.command('t', relative, endX, endY);
	}

	//
	ellipticalArc(
		radiusX, radiusY,
		largeArcFlag, sweepFlag,
		x, y,
		relative = true
	) {
		return this.command('a', relative, radiusX, radiusY, largeArcFlag, sweepFlag, x, y);
	}

	circle(x,y, rx, ry, relative) {
        this.moveTo(x - rx, y, relative);
		this.ellipticalArc(rx, ry, 0, '1,1', rx*2, 0);
		this.ellipticalArc(rx, ry, 0, '1,1', -rx*2, 0);
		return this;
	}
}

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
		
		this.node = document.createElement('div');
		this.node.classList.add('graph');
		this.node.style.width = 'fit-content';

		this.svgStroke = new SVGShape().fill(0);
		this.svgFill = new SVGShape().fill(0);
		this.svgOverlay = new SVGShape();
		this.svgStroke.node.classList.add('graphStroke');
		this.svgFill.node.classList.add('graphFill');
		this.svgOverlay.node.classList.add('graphLine');

		this.svgContainer = new SVGShapeContainer(0,0)
		.add(this.svgStroke, this.svgFill, this.svgOverlay)

		this.node.append(this.svgContainer.node);
		
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
		
		this.setSize(data.width, data.height);
		this.extendStyle(style);
		this.update();
	}
	setSize(width, height) {
		width = width ?? 200;
		height = height ?? 200;

		this.width = width;
		this.height = height;

		this.svgContainer.setSize(width, height);

		this.node.style.width = width + 'px';
		this.node.style.height = height + 'px';
		this.updateSVGOrigin();
	}
	computeMinMax() {
		if (typeof this.minmax != 'object') this.minmax = [];
		
		this.minmax[0] = Math.min(...this.datapoints);
		this.minmax[1] = Math.max(...this.datapoints);
		return this;
	}
	updateSVGOrigin() {
		const offsetX = this.width * this.style.padding * 0.5;
		const offsetY = this.height * this.style.padding * 0.5;
		this.svgContainer.groupNode.setAttributeNS(null, 'transform-origin', `${offsetX}px ${offsetY}px`);
	}
	/** @param {GraphStyleData} data */
	extendStyle(data) {
		['strokeWidth','padding','lineSize','lineColor','strokeColor','fillColor']
		.forEach(key => {
			this.style[key] = data[key] ?? this.style[key];
		});
		this.svgContainer.setPadding(this.style.padding);
		this.updateSVGOrigin();

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
		if (1 in this.datapoints) {
			this.svgFill.lineTo(this.width, this.height, false).lineTo(0, this.height, false);
		}
		// 0 sized circle that keeps the the height of the container constant
		this.svgFill.circle(0,0, 0, 0, false);
	}
}

Object.assign(window, {Graph})
})();
