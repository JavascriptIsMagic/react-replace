var React = require('react'),
	replace = require('react-replace'),
	util = require('util');

console.log(util.inspect(
	replace.by.classNames(
		{
			test: function (element) {
				return { style: { display: 'block !important' } };
			}
		}
	)(
		React.createElement('div', {
			children: [
				React.createElement('div', { }),
				React.createElement('div', {
					children: [
						React.createElement('div', {
							
						}),
						React.createElement('div', {
							className: 'test',
						}),
						React.createElement('div', {
							
						})
					]
				})
			]
		})
	),
	{
		colors:true,
		depth: 15
	}
));