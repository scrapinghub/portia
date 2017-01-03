import IconButton from './icon-button';

export default IconButton.extend({
  classNames: ['list-item-icon'],

  beforeClick() {
      const action = this.get('onClick');
      if (action) { action(); }
  }
});
