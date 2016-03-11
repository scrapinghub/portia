import AnimationContainer from './animation-container';

export default AnimationContainer.extend({
    tagName: 'li',
    classNames: ['tree-list-item'],

    setWidth: false,
    hasChildren: false
});
