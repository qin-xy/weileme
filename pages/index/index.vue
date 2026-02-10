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
			<view class="menu-grid">
				<view class="menu-card client" @tap="navigateTo('/pages/order/create')">
					<view class="card-content">
						<view class="menu-text">我是客户</view>
						<view class="menu-desc">预约上门喂宠/遛狗</view>
						<view class="menu-action">立即预约 →</view>
					</view>
					<view class="menu-icon">🐶</view>
				</view>

				<view class="menu-card worker" @tap="navigateToWorker">
					<view class="card-content">
						<view class="menu-text">我是上门人</view>
						<view class="menu-desc">登记接单，服务记录</view>
						<view class="menu-action">去接单 →</view>
					</view>
					<view class="menu-icon">👤</view>
				</view>
			</view>

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
</template>

<script>
	import { useApi } from '@/utils/config.js';
	import { getOrders } from '@/utils/api.js';

	export default {
		data() {
			return {
				recentOrders: []
			}
		},
		onShow() {
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
		},
		methods: {
			navigateTo(url) {
				uni.navigateTo({ url });
			},
			navigateToWorker() {
				const workerInfo = uni.getStorageSync('worker_info');
				if (workerInfo) {
					uni.navigateTo({ url: '/pages/worker/orders' });
				} else {
					uni.navigateTo({ url: '/pages/worker/register' });
				}
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
		font-size: 24rpx;
		color: rgba(255, 255, 255, 0.9);
		margin-top: 4rpx;
	}

	.main-content {
		position: relative;
		z-index: 1;
		padding: 0 30rpx;
	}

	.menu-grid {
		display: flex;
		flex-direction: column;
		gap: 30rpx;
		margin-bottom: 50rpx;
	}

	.menu-card {
		padding: 40rpx;
		border-radius: 32rpx;
		display: flex;
		justify-content: space-between;
		align-items: center;
		box-shadow: 0 10rpx 30rpx rgba(0,0,0,0.05);
		position: relative;
		overflow: hidden;
	}

	.menu-card.client {
		background: #ffffff;
		border-left: 10rpx solid #ffca28;
	}

	.menu-card.worker {
		background: #ffffff;
		border-left: 10rpx solid #4fc3f7;
	}

	.menu-text {
		font-size: 36rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 8rpx;
	}

	.menu-desc {
		font-size: 24rpx;
		color: #888;
		margin-bottom: 20rpx;
	}

	.menu-action {
		font-size: 24rpx;
		font-weight: bold;
		color: #ff9800;
	}

	.worker .menu-action {
		color: #03a9f4;
	}

	.menu-icon {
		font-size: 80rpx;
		opacity: 0.2;
		position: absolute;
		right: 20rpx;
		bottom: -10rpx;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 24rpx;
		padding: 0 10rpx;
	}

	.section-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
	}

	.section-more {
		font-size: 24rpx;
		color: #999;
	}

	.order-card {
		background-color: #fff;
		padding: 30rpx;
		border-radius: 24rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 4rpx 15rpx rgba(0,0,0,0.03);
	}

	.order-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20rpx;
		padding-bottom: 20rpx;
		border-bottom: 1rpx solid #f5f5f5;
	}

	.order-type {
		display: flex;
		align-items: center;
	}

	.type-icon {
		margin-right: 12rpx;
		font-size: 28rpx;
	}

	.order-date {
		font-size: 28rpx;
		font-weight: 600;
		color: #333;
	}

	.order-status {
		font-size: 22rpx;
		padding: 6rpx 16rpx;
		border-radius: 20rpx;
	}

	.order-status.pending {
		background-color: #fff3e0;
		color: #ff9800;
	}

	.order-status.accepted {
		background-color: #e3f2fd;
		color: #2196f3;
	}

	.order-status.completed {
		background-color: #e8f5e9;
		color: #4caf50;
	}

	.order-addr {
		display: flex;
		align-items: flex-start;
	}

	.addr-icon {
		font-size: 24rpx;
		margin-right: 8rpx;
		margin-top: 4rpx;
	}

	.addr-text {
		font-size: 26rpx;
		color: #666;
		line-height: 1.4;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding-top: 60rpx;
	}

	.empty-icon {
		font-size: 100rpx;
		margin-bottom: 20rpx;
		opacity: 0.5;
	}

	.empty-text {
		font-size: 26rpx;
		color: #999;
	}
</style>
