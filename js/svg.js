const ___xmlns___ = "http://www.w3.org/2000/svg";

class SVGShapeContainer {
	constructor(width, height) {
		this.width = width;
		this.height = height;

		this.node = document.createElementNS(___xmlns___, "svg");
		this.groupNode = document.createElementNS(___xmlns___, "g");

		this.node.setAttributeNS(null, "viewBox", "0 0 " + width + " " + height);
		this.node.setAttributeNS(null, "width", width);
		this.node.setAttributeNS(null, "height", height);

		this.node.append(this.groupNode);
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

		this.node = document.createElementNS(___xmlns___, "path");
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
