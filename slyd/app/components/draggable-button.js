import BsButton from './bs-button';
import Draggable from '../mixins/draggable';

export default BsButton.extend(Draggable, {
    tagName: 'span'
});
