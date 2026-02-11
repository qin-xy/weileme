<template>
	<view class="container">
		<!-- 顶部背景饰品 -->
		<view class="header-bg"></view>

		<view class="header">
			<view class="brand">
				<view class="logo-wrapper">
					<text class="logo-icon">🐾</text>
				</view>
				<view class="brand-info">
					<view class="title">喂了么</view>
					<view class="subtitle">专业宠物上门服务平台</view>
				</view>
			</view>
		</view>

		<view class="main-content">
			<view class="role-selection" v-if="!userRole">
				<view class="role-title">请选择您的身份</view>
				<view class="role-grid">
					<view class="role-card client" @tap="selectRole('client')">
						<view class="role-icon">🐶</view>
						<view class="role-title-text">我是客户</view>
						<view class="role-desc">需要上门喂宠/遛狗服务</view>
						<view class="role-action">作为客户下单 →</view>
					</view>
					<view class="role-card worker" @tap="selectRole('worker')">
						<view class="role-icon">👤</view>
						<view class="role-title-text">我是上门人</view>
						<view class="role-desc">提供上门喂宠/遛狗服务</view>
						<view class="role-action">作为上门人接单 →</view>
					</view>
				</view>
			</view>

			<view class="client-mode" v-if="userRole === 'client'">
				<view class="menu-grid">
					<view class="menu-card" @tap="navigateTo('/pages/order/create')">
						<view class="card-content">
							<view class="menu-text">我要下单</view>
							<view class="menu-desc">预约上门喂宠/遛狗</view>
							<view class="menu-action">立即预约 →</view>
						</view>
						<view class="menu-icon">🐶</view>
					</view>

					<view class="menu-card" @tap="navigateToWorker">
						<view class="card-content">
							<view class="menu-text">切换身份</view>
							<view class="menu-desc">切换到上门人身份</view>
							<view class="menu-action">切换身份 →</view>
						</view>
						<view class="menu-icon">🔄</view>
					</view>
				</view>
			</view>

			<view class="worker-mode" v-if="userRole === 'worker'">
				<view class="worker-header">
					<view class="worker-welcome">欢迎您，上门人</view>
					<view class="worker-actions">
						<button class="switch-btn" @tap="switchRole">切换身份</button>
					</view>
				</view>

				<view class="worker-status">
					<view class="status-card">
						<view class="status-icon">📍</view>
						<view class="status-info">
							<view class="status-title">服务状态</view>
							<view class="status-desc">{{workerInfo ? '已登记位置' : '未登记位置'}}</view>
						</view>
						<view class="status-action">
							<text class="action-btn" @tap="navigateToRegister" v-if="!workerInfo">登记位置</text>
							<text class="action-btn" @tap="navigateToOrders" v-if="workerInfo">开始接单</text>
						</view>
					</view>
				</view>

				<view class="quick-actions">
					<view class="quick-item" @tap="navigateToRegister">
						<text class="quick-icon">📍</text>
						<text class="quick-text">登记位置</text>
					</view>
					<view class="quick-item" @tap="navigateToOrders">
						<text class="quick-icon">📋</text>
						<text class="quick-text">任务中心</text>
					</view>
					<view class="quick-item" @tap="navigateToUpload">
						<text class="quick-icon">📷</text>
						<text class="quick-text">服务记录</text>
					</view>
				</view>
			</view>

			<!-- 订单展示区 (仅在选择角色后显示) -->
			<view class="orders-section" v-if="userRole">
				<view class="section-header" v-if="recentOrders.length > 0">
					<text class="section-title">我的订单</text>
					<text class="section-more" @tap="navigateTo('/pages/order/list')" v-if="false">全部订单 ></text>
				</view>

				<view class="order-list" v-if="recentOrders.length > 0">
					<view class="order-card" v-for="order in recentOrders" :key="order.id">
						<view class="order-header">
							<view class="order-type">
								<text class="type-icon">📅</text>
								<text class="order-date">{{order.date}}</text>
							</view>
							<text class="order-status" :class="order.status">{{getStatusText(order.status)}}</text>
						</view>
						<view class="order-body">
							<view class="order-addr">
								<text class="addr-icon">📍</text>
								<text class="addr-text">{{order.address}}</text>
							</view>
						</view>
					</view>
				</view>

				<view class="empty-state" v-if="recentOrders.length === 0">
					<view class="empty-icon">🦴</view>
					<view class="empty-text">还没有订单，快去体验吧</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { useApi } from '@/utils/config.js';
	import { getOrders } from '@/utils/api.js';

	export default {
		data() {
			return {
				userRole: '',
				recentOrders: [],
				workerInfo: null
			}
		},
		onLoad() {
			this.initUserRole();
		},
		onShow() {
			this.initUserRole();

			if (this.userRole === 'client') {
				if (useApi()) {
					const wechatId = uni.getStorageSync('my_wechat_id');
					if (wechatId) {
						getOrders({ wechatId, limit: 3 }).then(list => { this.recentOrders = list || []; }).catch(() => { this.recentOrders = []; });
					} else {
						this.recentOrders = [];
					}
				} else {
					this.recentOrders = (uni.getStorageSync('orders') || []).slice(-3).reverse();
				}
			} else if (this.userRole === 'worker') {
				this.workerInfo = uni.getStorageSync('worker_info');
			}
		},
		methods: {
			initUserRole() {
				this.userRole = uni.getStorageSync('user_role') || '';
				if (this.userRole === 'worker') {
					this.workerInfo = uni.getStorageSync('worker_info');
				}
			},

			selectRole(role) {
				this.userRole = role;
				uni.setStorageSync('user_role', role);

				if (role === 'worker') {
					// 切换到上门人身份，检查是否已登记
					this.workerInfo = uni.getStorageSync('worker_info');
					if (!this.workerInfo) {
						uni.showModal({
							title: '提示',
							content: '请先登记您的位置信息',
							showCancel: false,
							success: () => {
								uni.navigateTo({ url: '/pages/worker/register' });
							}
						});
					}
				} else {
					// 切换到客户身份
					this.workerInfo = null;
				}
			},

			switchRole() {
				uni.showModal({
					title: '切换身份',
					content: '确定要切换到客户身份吗？',
					success: (res) => {
						if (res.confirm) {
							this.selectRole('');
						}
					}
				});
			},

			navigateTo(url) {
				uni.navigateTo({ url });
			},

			navigateToWorker() {
				if (!this.workerInfo) {
					uni.navigateTo({ url: '/pages/worker/register' });
				} else {
					uni.navigateTo({ url: '/pages/worker/orders' });
				}
			},

			navigateToRegister() {
				uni.navigateTo({ url: '/pages/worker/register' });
			},

			navigateToOrders() {
				uni.navigateTo({ url: '/pages/worker/orders' });
			},

			navigateToUpload() {
				uni.navigateTo({ url: '/pages/worker/upload' });
			},

			getStatusText(status) {
				const map = { 'pending': '待接单', 'accepted': '待上门', 'completed': '服务完成' };
				return map[status] || status;
			}
		}
	}
</script>

<style>
	.container {
		min-height: 100vh;
		background-color: #f8f9fa;
		position: relative;
		padding-bottom: 40rpx;
	}

	.header-bg {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 360rpx;
		background: linear-gradient(135deg, #ffca28, #ff9800);
		border-radius: 0 0 40rpx 40rpx;
		z-index: 0;
	}

	.header {
		position: relative;
		z-index: 1;
		padding: 80rpx 40rpx 60rpx;
	}

	.brand {
		display: flex;
		align-items: center;
	}

	.logo-wrapper {
		width: 100rpx;
		height: 100rpx;
		background-color: rgba(255, 255, 255, 0.9);
		border-radius: 30rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 8rpx 20rpx rgba(0,0,0,0.1);
		margin-right: 24rpx;
	}

	.logo-icon {
		font-size: 50rpx;
	}

	.title {
		font-size: 44rpx;
		font-weight: 800;
		color: #fff;
		letter-spacing: 2rpx;
	}

	.subtitle {
		font-size: 26rpx;
		color: rgba(255, 255, 255, 0.8);
		margin-top: 8rpx;
	}

	.main-content {
		position: relative;
		z-index: 1;
		padding: 0 40rpx;
		margin-top: -20rpx;
	}

	.menu-grid {
		display: flex;
		gap: 24rpx;
		margin-bottom: 48rpx;
	}

	.menu-card {
		flex: 1;
		background-color: #fff;
		border-radius: 32rpx;
		padding: 32rpx;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		height: 280rpx;
		box-shadow: 0 12rpx 30rpx rgba(0,0,0,0.05);
		position: relative;
		overflow: hidden;
	}

	.menu-card.client {
		background: linear-gradient(135deg, #ffffff, #fffdfa);
	}

	.menu-card.worker {
		background: linear-gradient(135deg, #ffffff, #f7faff);
	}

	.menu-text {
		font-size: 32rpx;
		font-weight: 800;
		color: #333;
		margin-bottom: 8rpx;
	}

	.menu-desc {
		font-size: 22rpx;
		color: #999;
		margin-bottom: 24rpx;
	}

	.menu-action {
		font-size: 24rpx;
		font-weight: 600;
		color: #ff9800;
	}

	.menu-icon {
		position: absolute;
		right: -10rpx;
		bottom: -10rpx;
		font-size: 80rpx;
		opacity: 0.15;
		transform: rotate(-15deg);
	}

	.section-header {
		position: relative;
		z-index: 1;
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 22rpx;
	}

	.section-title {
		font-size: 30rpx;
		font-weight: 700;
		color: #333;
	}

	.order-list {
		position: relative;
		z-index: 1;
	}

	.order-card {
		background: #fff;
		padding: 30rpx;
		border-radius: 28rpx;
		margin-bottom: 24rpx;
		box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.04);
	}

	.order-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20rpx;
	}

	.order-type {
		display: flex;
		align-items: center;
		gap: 12rpx;
	}

	.type-icon {
		font-size: 28rpx;
	}

	.order-date {
		font-size: 26rpx;
		font-weight: 600;
		color: #2f231c;
	}

	.order-status {
		font-size: 20rpx;
		padding: 6rpx 16rpx;
		border-radius: 16rpx;
		font-weight: 700;
	}

	.order-status.pending {
		background-color: #fff1e1;
		color: #d46b2c;
	}

	.order-status.accepted {
		background-color: #e3f0ff;
		color: #357bd8;
	}

	.order-status.completed {
		background-color: #e5f7ed;
		color: #3f8f63;
	}

	.order-addr {
		display: flex;
		align-items: flex-start;
		gap: 8rpx;
	}

	.addr-icon {
		font-size: 22rpx;
		margin-top: 4rpx;
	}

	.addr-text {
		font-size: 24rpx;
		color: rgba(47, 35, 28, 0.7);
		line-height: 1.4;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding-top: 60rpx;
		position: relative;
		z-index: 1;
	}

	.empty-icon {
		font-size: 96rpx;
		margin-bottom: 18rpx;
		opacity: 0.6;
	}

	.empty-text {
		font-size: 26rpx;
		color: rgba(47, 35, 28, 0.55);
	}

	/* 角色选择样式 */
	.role-selection {
		text-align: center;
		padding: 40rpx 0;
	}

	.role-title {
		font-size: 36rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 48rpx;
	}

	.role-grid {
		display: flex;
		gap: 24rpx;
		margin-bottom: 48rpx;
	}

	.role-card {
		flex: 1;
		background-color: #fff;
		border-radius: 32rpx;
		padding: 40rpx;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		height: 320rpx;
		box-shadow: 0 12rpx 30rpx rgba(0,0,0,0.05);
		position: relative;
		overflow: hidden;
	}

	.role-card.client {
		background: linear-gradient(135deg, #ffffff, #fffdfa);
	}

	.role-card.worker {
		background: linear-gradient(135deg, #ffffff, #f7faff);
	}

	.role-icon {
		font-size: 80rpx;
		margin-bottom: 24rpx;
	}

	.role-title-text {
		font-size: 32rpx;
		font-weight: 800;
		color: #333;
		margin-bottom: 12rpx;
	}

	.role-desc {
		font-size: 22rpx;
		color: #999;
		margin-bottom: 32rpx;
	}

	.role-action {
		font-size: 24rpx;
		font-weight: 600;
		color: #ff9800;
	}

	/* 客户模式样式 */
	.client-mode {
		margin-top: -20rpx;
	}

	/* 上门人模式样式 */
	.worker-mode {
		margin-top: -20rpx;
	}

	.worker-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 32rpx;
	}

	.worker-welcome {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
	}

	.switch-btn {
		background-color: #f0f0f0;
		color: #666;
		border: none;
		border-radius: 20rpx;
		padding: 12rpx 24rpx;
		font-size: 24rpx;
	}

	.worker-status {
		margin-bottom: 32rpx;
	}

	.status-card {
		background: linear-gradient(135deg, #ffffff, #f7faff);
		border-radius: 24rpx;
		padding: 32rpx;
		display: flex;
		align-items: center;
		box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.04);
	}

	.status-icon {
		font-size: 48rpx;
		margin-right: 24rpx;
	}

	.status-info {
		flex: 1;
	}

	.status-title {
		font-size: 28rpx;
		font-weight: 600;
		color: #333;
		margin-bottom: 8rpx;
	}

	.status-desc {
		font-size: 24rpx;
		color: #666;
	}

	.status-action {
		text-align: right;
	}

	.action-btn {
		background-color: #ff9800;
		color: #fff;
		border-radius: 16rpx;
		padding: 12rpx 24rpx;
		font-size: 24rpx;
		font-weight: 600;
	}

	.quick-actions {
		display: flex;
		justify-content: space-between;
		gap: 16rpx;
	}

	.quick-item {
		flex: 1;
		background-color: #fff;
		border-radius: 20rpx;
		padding: 32rpx 20rpx;
		text-align: center;
		box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.04);
	}

	.quick-icon {
		font-size: 40rpx;
		margin-bottom: 12rpx;
	}

	.quick-text {
		font-size: 24rpx;
		color: #333;
		font-weight: 600;
	}
</style>
