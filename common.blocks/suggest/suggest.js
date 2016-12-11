modules.define('suggest', ['i-bem-dom'], function(provide, bemDom) {
	provide(bemDom.declBlock(this.name, {
		onSetMod: {
			js() {
				console.log('inited');
			}
		}
	}))
});
