'use strict';

/**
 * 선
 * @class Line
 */
var Line = function() {
	if(!(this instanceof Line)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	// (x,y,z) = (x0,y0,z0) + lambda * (u, v, w);
	this.point = new Point3D();
	this.direction = new Point3D();
};

/**
 * 어떤 일을 하고 있습니까?
 * @param px 변수
 * @param py 변수
 * @param pz 변수
 * @param dx 변수
 * @param dy 변수
 * @param dz 변수
 */
Line.prototype.setPointAndDir = function(px, py, pz, dx, dy, dz) {
	this.point.set(px, py, pz);
	this.direction.set(dx, dy, dz);
	this.direction.unitary();
};