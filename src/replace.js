'use strict';
var
	React = require('react/addons'),
	cloneWithProps = React.addons.cloneWithProps,
	merge = require('merge');

module.exports = replace;
replace.by = replaceBy;
replace.by.classNames = replaceByClassNames;
replace.has = {};
replace.has.className = hasClassName;

/** @function replace(transform)(Elements) -> Elements
	@function transform(Element) -> Element
	Applies the transform function if predicate(Element) returns true
	over all nodes in the Elements tree.
*/
function replace(transform) {
	if (transform && transform._isReactElement) {
		transform = transform.props;
	}
	if (typeof transform !== 'function') {
		transform = (function (props) {
			return function () {
				return props;
			};
		}(transform));
	}
	return function (Element) {
		var props = transform(Element);
		if (props === Element) {
			return Element;
		}
		if (props && props._isReactElement) {
			props = props.props;
		}
		var propsWithKeyAndRef = {};
		if (Element.key) { propsWithKeyAndRef.key = Element.key; }
		if (Element.ref) { propsWithKeyAndRef.ref = Element.ref; }
		return cloneWithProps(Element, merge(propsWithKeyAndRef, props));
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
			if (Elements && Elements._isReactElement) {
				if (predicate(Elements)) {
					Elements = replaceTransform(Elements);
				}
				if (Elements.props.children) {
					return replace({ children: query(Elements.props.children) })(Elements);
				}
			}
			return Elements;
		};
		return query;
	};
	return map;
}

/** @function replace.has.className(name)(Element) -> Boolean
	Accepts a string of class names separated by spaces,
		and returns a predicate that returns true
		if any of those class names match Element.className
*/
function hasClassName(names) {
	var regex = new RegExp('\\b(' + names.replace(/^\W+|\W+$/g, '').replace(/\W+/g, '|') + ')\\b', 'i');
	return function (Element) {
		return (Element && regex.test(Element.props.className));
	}
}

/** @function replace.by.className({ [names]: transform(Element) -> Element })(Elements) -> Elements
	Applies the transforms to all nodes in the Elements tree
		if any of those class names match Element.className
*/
function replaceByClassNames(namesToTransforms) {
	var maybeTransforms = Object.keys(namesToTransforms).
		reduce(function (next, names) {
			var predicate = hasClassName(names),
				transform = replace(namesToTransforms[names]);
			return function (Element) {
				if (predicate(Element)) {
					Element = transform(Element);
				}
				return next(Element);
			}
		}, function (Element) { return Element; });
	function query(Element) {
		if (Array.isArray(Element)) {
			return Element.map(query);
		}
		if (Element && Element._isReactElement) {
			Element = maybeTransforms(Element);
			if (Element.props.children) {
				Element = replace({ children: query(Element.props.children) })(Element);
			}
		}
		return Element;
	}
	return query;
}
