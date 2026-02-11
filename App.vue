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
		--bg: #f8f9fa;
		--surface: #ffffff;
		--primary: #ffca28;
		--primary-strong: #ff9800;
		--text: #333333;
		--text-muted: #999999;
		--border: #eeeeee;
		--radius-lg: 32rpx;
		--radius-md: 24rpx;
		--radius-sm: 16rpx;
		font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
		color: #333;
		background-color: #f8f9fa;
	}

	.view, view, text, button, input, textarea {
		box-sizing: border-box;
	}
</style>
