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
	/* ============================================
	   咖啡主题设计系统 - Coffee Theme Design System
	   ============================================ */
	:root, page {
		/* 主色调 - 咖啡色系 */
		--primary: #C4A77D;
		--primary-light: #D4BC94;
		--primary-dark: #A68B5B;
		--primary-gradient: linear-gradient(135deg, #C4A77D 0%, #A68B5B 100%);
		
		/* 辅助色 - 暖色调 */
		--accent: #E8B87D;
		--accent-light: #F5D5A8;
		--accent-warm: #F4E4D6;
		
		/* 背景色 */
		--bg-cream: #FAF7F2;
		--bg-warm: #F5F0E8;
		--bg-card: #FFFFFF;
		--bg-elevated: #FFFBF7;
		
		/* 文字色 */
		--text-primary: #3D3229;
		--text-secondary: #6B5D4D;
		--text-tertiary: #9B8B7A;
		--text-muted: #B8A99A;
		--text-inverse: #FFFFFF;
		
		/* 边框与分隔线 */
		--border-light: #E8E0D5;
		--border-default: #D4C8B8;
		--divider: #F0EBE3;
		
		/* 状态色 */
		--success: #7D9B76;
		--warning: #D4A574;
		--error: #C4786E;
		--info: #7D9BC4;
		
		/* 阴影 */
		--shadow-sm: 0 2rpx 8rpx rgba(61, 50, 41, 0.06);
		--shadow-md: 0 4rpx 16rpx rgba(61, 50, 41, 0.08);
		--shadow-lg: 0 8rpx 32rpx rgba(61, 50, 41, 0.12);
		--shadow-glow: 0 4rpx 20rpx rgba(196, 167, 125, 0.25);
		
		/* 圆角 */
		--radius-sm: 12rpx;
		--radius-md: 20rpx;
		--radius-lg: 28rpx;
		--radius-xl: 36rpx;
		--radius-full: 9999rpx;
		
		/* 间距 */
		--space-xs: 8rpx;
		--space-sm: 16rpx;
		--space-md: 24rpx;
		--space-lg: 32rpx;
		--space-xl: 48rpx;
		
		/* 字体 */
		font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Segoe UI", sans-serif;
		color: var(--text-primary);
		background-color: var(--bg-cream);
	}

	/* 全局重置 */
	.view, view, text, button, input, textarea, scroll-view {
		box-sizing: border-box;
	}

	/* 页面容器 */
	.page-container {
		min-height: 100vh;
		background: linear-gradient(180deg, var(--bg-cream) 0%, var(--bg-warm) 100%);
	}

	/* ============================================
	   动效系统 - Animation System
	   ============================================ */

	/* 淡入动画 */
	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	/* 从下方滑入 */
	@keyframes slideUp {
		from { 
			opacity: 0;
			transform: translateY(30rpx);
		}
		to { 
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* 从上方滑入 */
	@keyframes slideDown {
		from { 
			opacity: 0;
			transform: translateY(-30rpx);
		}
		to { 
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* 从左侧滑入 */
	@keyframes slideInLeft {
		from { 
			opacity: 0;
			transform: translateX(-30rpx);
		}
		to { 
			opacity: 1;
			transform: translateX(0);
		}
	}

	/* 从右侧滑入 */
	@keyframes slideInRight {
		from { 
			opacity: 0;
			transform: translateX(30rpx);
		}
		to { 
			opacity: 1;
			transform: translateX(0);
		}
	}

	/* 缩放进入 */
	@keyframes scaleIn {
		from { 
			opacity: 0;
			transform: scale(0.9);
		}
		to { 
			opacity: 1;
			transform: scale(1);
		}
	}

	/* 弹跳动画 */
	@keyframes bounce {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-10rpx); }
	}

	/* 脉冲动画 */
	@keyframes pulse {
		0%, 100% { transform: scale(1); }
		50% { transform: scale(1.05); }
	}

	/* 摇晃动画 */
	@keyframes shake {
		0%, 100% { transform: translateX(0); }
		25% { transform: translateX(-5rpx); }
		75% { transform: translateX(5rpx); }
	}

	/* 旋转动画 */
	@keyframes rotate {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	/* 浮动动画 */
	@keyframes float {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-8rpx); }
	}

	/* 闪烁动画 */
	@keyframes shimmer {
		0% { background-position: -200% 0; }
		100% { background-position: 200% 0; }
	}

	/* 呼吸动画 */
	@keyframes breathe {
		0%, 100% { 
			opacity: 1;
			transform: scale(1);
		}
		50% { 
			opacity: 0.8;
			transform: scale(0.98);
		}
	}

	/* 卡片进入动画 - 依次延迟 */
	@keyframes cardEnter {
		from {
			opacity: 0;
			transform: translateY(40rpx) scale(0.95);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	/* 应用动画类 */
	.anim-fade-in {
		animation: fadeIn 0.4s ease-out forwards;
	}

	.anim-slide-up {
		animation: slideUp 0.5s ease-out forwards;
	}

	.anim-slide-down {
		animation: slideDown 0.5s ease-out forwards;
	}

	.anim-slide-left {
		animation: slideInLeft 0.5s ease-out forwards;
	}

	.anim-slide-right {
		animation: slideInRight 0.5s ease-out forwards;
	}

	.anim-scale-in {
		animation: scaleIn 0.4s ease-out forwards;
	}

	.anim-bounce {
		animation: bounce 0.6s ease-in-out;
	}

	.anim-pulse {
		animation: pulse 0.3s ease-in-out;
	}

	.anim-shake {
		animation: shake 0.4s ease-in-out;
	}

	.anim-rotate {
		animation: rotate 0.6s linear;
	}

	.anim-float {
		animation: float 3s ease-in-out infinite;
	}

	.anim-breathe {
		animation: breathe 2s ease-in-out infinite;
	}

	/* 卡片依次进入动画 */
	.card-enter {
		opacity: 0;
		animation: cardEnter 0.5s ease-out forwards;
	}

	.card-enter:nth-child(1) { animation-delay: 0.05s; }
	.card-enter:nth-child(2) { animation-delay: 0.1s; }
	.card-enter:nth-child(3) { animation-delay: 0.15s; }
	.card-enter:nth-child(4) { animation-delay: 0.2s; }
	.card-enter:nth-child(5) { animation-delay: 0.25s; }
	.card-enter:nth-child(6) { animation-delay: 0.3s; }
	.card-enter:nth-child(7) { animation-delay: 0.35s; }
	.card-enter:nth-child(8) { animation-delay: 0.4s; }

	/* 延迟动画类 */
	.delay-1 { animation-delay: 0.1s; }
	.delay-2 { animation-delay: 0.2s; }
	.delay-3 { animation-delay: 0.3s; }
	.delay-4 { animation-delay: 0.4s; }
	.delay-5 { animation-delay: 0.5s; }

	/* ============================================
	   交互动效 - Interactive Effects
	   ============================================ */

	/* 卡片样式 */
	.card {
		background: var(--bg-card);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-md);
		padding: var(--space-md);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.card-hover:hover {
		transform: translateY(-4rpx);
		box-shadow: var(--shadow-lg);
	}

	.card:active {
		transform: scale(0.98);
	}

	.card-elevated {
		background: var(--bg-elevated);
		box-shadow: var(--shadow-lg);
	}

	/* 按钮样式 */
	.btn-primary {
		background: var(--primary-gradient);
		color: var(--text-inverse);
		border-radius: var(--radius-full);
		font-weight: 600;
		box-shadow: var(--shadow-glow);
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.btn-primary:hover {
		transform: translateY(-2rpx);
		box-shadow: 0 6rpx 24rpx rgba(196, 167, 125, 0.4);
	}

	.btn-primary:active {
		transform: scale(0.96);
		opacity: 0.95;
	}

	.btn-secondary {
		background: var(--bg-card);
		color: var(--text-secondary);
		border: 2rpx solid var(--border-light);
		border-radius: var(--radius-full);
		font-weight: 500;
		transition: all 0.2s ease;
	}

	.btn-secondary:active {
		background: var(--bg-warm);
		transform: scale(0.98);
	}

	/* 输入框样式 */
	.input-field {
		background: var(--bg-warm);
		border: 2rpx solid transparent;
		border-radius: var(--radius-md);
		padding: 24rpx 28rpx;
		font-size: 28rpx;
		color: var(--text-primary);
		transition: all 0.2s ease;
	}

	.input-field:focus {
		background: var(--bg-card);
		border-color: var(--primary);
		box-shadow: 0 0 0 4rpx rgba(196, 167, 125, 0.15);
	}

	/* 标签样式 */
	.tag {
		background: var(--accent-warm);
		color: var(--text-secondary);
		padding: 8rpx 20rpx;
		border-radius: var(--radius-full);
		font-size: 22rpx;
		font-weight: 500;
		transition: all 0.2s ease;
	}

	.tag:hover {
		transform: scale(1.05);
	}

	.tag-primary {
		background: var(--primary-gradient);
		color: var(--text-inverse);
	}

	/* 图标动效 */
	.icon-anim {
		transition: transform 0.3s ease;
	}

	.icon-anim:hover {
		transform: scale(1.2) rotate(10deg);
	}

	/* 列表项动效 */
	.list-item {
		transition: all 0.2s ease;
	}

	.list-item:active {
		transform: translateX(8rpx);
		background: var(--bg-warm);
	}

	/* 图片动效 */
	.image-hover {
		transition: all 0.3s ease;
		overflow: hidden;
	}

	.image-hover image {
		transition: transform 0.3s ease;
	}

	.image-hover:hover image {
		transform: scale(1.05);
	}

	/* 加载动画 */
	.loading-spinner {
		width: 40rpx;
		height: 40rpx;
		border: 4rpx solid var(--border-light);
		border-top-color: var(--primary);
		border-radius: 50%;
		animation: rotate 0.8s linear infinite;
	}

	/* 骨架屏动画 */
	.skeleton {
		background: linear-gradient(90deg, var(--bg-warm) 25%, var(--bg-card) 50%, var(--bg-warm) 75%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
	}

	/* 空状态 */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 120rpx 40rpx;
		animation: fadeIn 0.5s ease-out;
	}

	.empty-icon {
		width: 160rpx;
		height: 160rpx;
		background: var(--accent-warm);
		border-radius: var(--radius-full);
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 32rpx;
		font-size: 80rpx;
		animation: float 3s ease-in-out infinite;
	}

	.empty-title {
		font-size: 32rpx;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 12rpx;
	}

	.empty-desc {
		font-size: 26rpx;
		color: var(--text-tertiary);
		text-align: center;
	}

	/* 分隔线 */
	.divider {
		height: 2rpx;
		background: var(--divider);
		margin: 24rpx 0;
	}

	/* 滚动条美化 */
	::-webkit-scrollbar {
		width: 0;
		height: 0;
	}

	/* 页面切换过渡 */
	.page-transition-enter {
		opacity: 0;
		transform: translateX(30rpx);
	}

	.page-transition-enter-active {
		opacity: 1;
		transform: translateX(0);
		transition: all 0.3s ease-out;
	}

	.page-transition-exit {
		opacity: 1;
		transform: translateX(0);
	}

	.page-transition-exit-active {
		opacity: 0;
		transform: translateX(-30rpx);
		transition: all 0.3s ease-in;
	}
</style>
