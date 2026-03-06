<script>
	export default {
		onLaunch: function() {
			console.log('App Launch')
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style>
	:root, page {
		/* Backgrounds */
		--bg-main: #FDF8F5;
		--bg-header: #F2E5D9;
		--surface: #FFFFFF;
		
		/* Brand Colors */
		--primary: #FFB629;      /* Mustard Yellow CTA */
		--secondary: #8C2B1D;    /* Deep Red accent */
		--secondary-light: #FADBD8;
		
		/* Text Colors */
		--text-main: #2A1F1D;
		--text-muted: #8A7E7A;
		--text-inverse: #FFFFFF;
		
		/* Border & Shadows */
		--border-light: #EAE0DB;
		--shadow-soft: 0px 8px 24px rgba(42, 31, 29, 0.04);
		--shadow-strong: 0px 12px 32px rgba(140, 43, 29, 0.15);
		
		/* Border Radius */
		--radius-full: 999px;
		--radius-lg: 48rpx;    /* 24px-32px */
		--radius-md: 32rpx;    /* 16px */
		--radius-sm: 16rpx;    /* 8px */

		font-family: 'Inter', -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
		color: var(--text-main);
		background-color: var(--bg-main);
	}

	view, text, scroll-view {
		box-sizing: border-box;
		word-break: break-all;
	}
</style>
