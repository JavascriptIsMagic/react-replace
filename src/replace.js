const React = require('react/addons'),
	cloneWithProps = React.addons.cloneWithProps,
	merge = require('merge');

module.exports = {
	replace: replace,
	replaceElementsByPredicate: replaceElementsByPredicate,
	replaceElementsByClassNames: replaceElementsByClassNames,
};

/** propertiesTransform(Transform | Element | PropertiesObject)(originalElement) -> PropertiesObject
	@argument ElementOrPropertiesObject
		Can be:
			function Transform(originalElement) -> Element or PropertiesObject
			or an Element (Element.props is used)
			or a PropertiesObject
	@returns PropertiesObject
*/
function propertiesTransform(transformElementToProperties) {
	var transform = (transformElementToProperties instanceof Function ?
		transformElementToProperties :
		function () { return transformElementToProperties; });
	return function (ElementOrProperties) {
		return (merge({},
			transform(ElementOrProperties && ElementOrProperties._isReactElement ?
				ElementOrProperties.props :
				ElementOrProperties)));
	}
}

/** replace(transformation)(originalElement) -> Element
	Calls React.addons.cloneWithProps and preserves Element.key and Element.ref,
	Use this if your intention is to replace the original Element instead of copying the original Element.
	This does not modify the original Element but will have the same key.
	@argument transformation see: propertiesTransform
	@arguments originalElements
	@examples
	```
		var replace = require('react-replace').replace;
		
		replace({ modified: true })(<div key="original"/>);
		replace(<div modified/>)(<div key="original"/>);
		replace(function (originalElement) { return { modified: true }; })(<div key="original"/>);
		replace(function (originalElement) { return <div modified/>; })(<div key="original"/>);
		
		// All return <div key="original" modified />
	```
*/
function replace(transformation) {
	transformation = propertiesTransform(transformation);
	function replaceTransformation(originalElements) {
		if (Array.isArray(originalElements)) {
			// originalElements is an array of Elements:
			return originalElements.map(replaceTransformation);
		}
		// originalElements is an Element:
		if (originalElements && originalElements._isReactElement) {
			return (cloneWithProps(originalElement, 
				merge({ key: originalElement.key, ref: originalElement.ref },
					properties(props))));
		}
		// originalElements is not an Element:
		return originalElements;
	}
	return replaceTransformation;
}

/** replaceElementsByPredicate(predicate)(transformation)(originalElements) -> Elements 
		Recusively searches originalElements tree 
		Filters by a predicate 
		Maps them over a transformation 
		Returns the new Elements tree without modifying the originalElements
	@argument @function predicate(Element) -> Boolean
		like what you would pass to Array.prototype.filter
	@argument @function transformation - like what you pass to Array.prototype.map
	@argument originalElements: Element
	@returns Elements
*/
function replaceElementsByPredicate(predicate) {
	return function (transformation) {
		transformation = replace(transformation);
		function byPredicate(originalElements) {
			if (Array.isArray(originalElements)) {
				return originalElements.map(byPredicate);
			}
			if (originalElements && originalElements._isReactElement && predicate(originalElements)) {
				return transformation(originalElements);
			}
			return originalElements;
		};
		return byPredicate;
	}
}

function classNamesToRegex(classNameString) {
	return new RegExp(classNameString.replace(/\W+/g, '|').replace(/^\|+|\|+$/g, ''), 'gi');
}

function predicateFromRegex(regex, options) {
	if (typeof regex === 'string')
		regex = new RegExp(regex, options);
	return (function (string) {
		return regex.test(string);
	});
}

function predicateFromClassNameRegex(regex, options) {
	var predicate = predicateFromRegex(regex, options);
	return (function (Element) {
		return (
			Element &&
			Element.props &&
			predicate(Element.props.className));
	});
}

/**
	replaceElementsByClassNames(Object { [className]: transformation(Element) -> Element })(Element) -> Element
*/
function replaceElementsByClassNames(classNamesToTransformations) {
	var transformations = Object.keys(classNamesToTransformations).
		map(function (key) {
			return (replaceElementsByPredicate(
				predicateFromClassNameRegex(
					classNamesToRegex(key)
				)
			)(
				propertiesTransform(classNamesToTransformations[key])
			));
		}).
		reduce(function (next, transformation) {
			return transformation(next);
		}, function (Element) {
			return Element;
		});
	return transforms;
}
