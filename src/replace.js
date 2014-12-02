'use strict';
const React = require('react/addons'),
	cloneWithProps = React.addons.cloneWithProps,
	merge = require('merge');

module.exports = merge(replace, {
	by: merge(replaceBy, {
		any: {
			className: replaceByAnyClassName,
		}
	}),
	has: {
		any: {
			className: hasAnyClassName,
		}
	},
});

/** @function replace(transform)(Elements) -> Elements
	@function transform(Element) -> Element
	Applies the transform function if predicate(Element) returns true
	over all nodes in the Elements tree.
*/
function replace(transform) {
	if (typeof transform !== 'function') {
		/** @todo: transform could be a set of new props? */
		throw new Error('replace(transform)(Element) transform must be a function.');
	}
	if (transform && transform._isReactElement) {
		transform = transform.props;
	}
	if (transform && typeof transform === 'object') {
		transform = function (props) {
			return function () {
				return props;
			};
		}(transform);
	}
	return function (Element) {
		var props = properties(transform(Element));
		if (props && props._isReactElement) {
			props = props.props;
		}
		return cloneWithProps(Element, merge({ key: Element.key, ref: Element.ref, }, props));
	}
}

/** @function replace.by(predicate)(transform)(Elements) -> Elements
	@function predicate(Element) -> Boolean like what you pass Array.prototype.filter
	@function transform(Element) -> Element like what you pass Array.prototype.map
	Applies the transform function if predicate(Element) returns true
	over all nodes in the Elements tree.
*/
function replaceBy(predicate) {
	if (typeof predicate !== 'function') {
		/** @todo: predicate could be a string query much like jquery css selectors? */
		throw new Error('replaceBy(predicate)(transform)(Elements) predicate must be a function.');
	}
	function map(transform) {
		var replaceTransform = replace(transform);
		function query(Elements) {
			if (Array.isArray(Elements)) {
				return Elements.map(query);
			}
			if (Elements && Elements._isReactElement && predicate(Elements)) {
				var Element = replaceTransform(Elements);
				if (Element.props.children) {
					Element.props.children = query(Element.props.children);
				}
				return Element;
			}
			return Elements;
		};
		return query;
	};
	return map;
}

/** @function replace.has.any.className(name)(Element) -> Boolean
	Accepts a string of class names separated by spaces,
		and returns a predicate that returns true
		if any of those class names match Element.className
*/
function hasAnyClassName(names) {
	var regex = new RegExp('\b' + names.replace(/^\W|\W$/g, '').replace(/\W+/g, '\b|\b') + '\b', 'i');
	return function (Element) {
		return (Element && regex.test(Element.className));
	}
}

/** @function replace.by.any.className({ [names]: transform(Element) -> Element })(Elements) -> Elements
	Applies the transforms to all nodes in the Elements tree
		if any of those class names match Element.className
*/
replaceByAnyClassName(namesToTransforms) {
	var transforms = Object.key(namesToTransforms).
		reduce(function (transforms, names) {
			var predicate = hasAnyClassName(names),
				transform = namesToTransforms[names];
			return function (Element) {
				if (Element && Element._isReactElement && predicate(Element)) {
					return transforms(transform(Element));
				}
				return Element;
			};
		}, function (Element) { return Element; });
	return replaceBy(function (Element) { return true; })(transforms);
}
