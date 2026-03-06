<template>
	<view class="container">
		<!-- 装饰性背景 -->
		<view class="top-bg"></view>

		<view class="content-wrapper">
			<view class="page-title">加入新成员</view>
			<view class="page-subtitle">让每一位伙伴都被用心记录</view>

			<view class="form-card">
				<!-- 头像选择 - 破局圆角感 -->
				<view class="avatar-section">
					<view class="avatar-wrapper" @tap="chooseAvatar">
						<image v-if="avatar" :src="avatar" mode="aspectFill" class="avatar-image"></image>
						<view v-else class="avatar-placeholder">
							<text class="placeholder-icon">🐶</text>
							<text class="placeholder-text">上传照片</text>
						</view>
						<view class="camera-badge">📷</view>
					</view>
				</view>

				<!-- 表单内容 -->
				<view class="form-body">
					<view class="input-group">
						<text class="field-label">它的名字是谁？</text>
						<input class="pill-input" v-model="pet.name" placeholder="名字/小名" placeholder-class="placeholder-style" />
					</view>

					<view class="input-group">
						<text class="field-label">它是谁？</text>
						<view class="type-grid">
							<view class="type-tag" v-for="(type, index) in petTypes" :key="index" :class="{active: pet.type === type}" @tap="pet.type = type">
								<text class="type-text">{{type}}</text>
							</view>
						</view>
					</view>

					<view class="input-row">
						<view class="input-group half">
							<text class="field-label">性别</text>
							<view class="gender-pill">
								<view class="gender-btn" :class="{active: pet.gender === 'male'}" @tap="pet.gender = 'male'">♂</view>
								<view class="gender-btn" :class="{active: pet.gender === 'female'}" @tap="pet.gender = 'female'">♀</view>
							</view>
						</view>
						<view class="input-group half">
							<text class="field-label">生日</text>
							<picker mode="date" :value="pet.birthday" @change="onBirthdayChange">
								<view class="pill-input picker-view" :class="{hasValue: pet.birthday}">
									{{pet.birthday || '选日期'}}
								</view>
							</picker>
						</view>
					</view>

					<view class="input-group">
						<text class="field-label">大概品种</text>
						<input class="pill-input" v-model="pet.breed" placeholder="例如：金毛、英短..." placeholder-class="placeholder-style" />
					</view>

					<view class="input-group">
						<text class="field-label">当下体重 (kg)</text>
						<input class="pill-input" v-model="pet.weight" type="digit" placeholder="0.0" placeholder-class="placeholder-style" />
					</view>
				</view>

				<view class="action-area">
					<button class="main-cta-btn" @tap="savePet">确认添加</button>
					<text class="cancel-btn" @tap="goBack">先不加了</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { createPet, uploadImage } from '../../utils/api.js';
	import { BASE_URL } from '../../utils/config.js';
	import { getUserId } from '../../utils/user.js';

	export default {
		data() {
			return {
				pet: { name: '', type: '', breed: '', gender: '', birthday: '', weight: '', avatar: '' },
				petTypes: ['狗狗', '猫咪', '鸟类', '其他'],
				avatar: ''
			}
		},
		methods: {
			onBirthdayChange(e) { this.pet.birthday = e.detail.value; },
			goBack() { uni.navigateBack(); },
			chooseAvatar() {
				uni.chooseImage({
					count: 1,
					sizeType: ['compressed'],
					success: (res) => {
						this.avatar = res.tempFilePaths[0];
						this.pet.avatar = res.tempFilePaths[0];
					}
				});
			},
			async savePet() {
				if (!this.pet.name.trim() || !this.pet.type) {
					uni.showToast({ title: '名字和类型是必填哦', icon: 'none' });
					return;
				}
				try {
					uni.showLoading({ title: '正在加入...' });
					const userId = await getUserId();
					const avatar = await this.uploadAvatar(this.avatar);
					await createPet({ userId, ...this.pet, avatar });
					uni.hideLoading();
					uni.showToast({ title: '添加成功！', icon: 'success' });
					setTimeout(() => uni.navigateBack(), 1500);
				} catch (error) {
					uni.hideLoading();
					uni.showToast({ title: '失败了，重试下？', icon: 'none' });
				}
			},
			async uploadAvatar(avatarPath) {
				if (!avatarPath || /^https?:\/\//.test(avatarPath)) return avatarPath || '';
				const result = await uploadImage(avatarPath);
				return result.url ? `${BASE_URL}${result.url}` : (result.path || avatarPath);
			}
		}
	}
</script>

<style>
	.container {
		min-height: 100vh;
		background-color: var(--bg-main);
		position: relative;
	}

	.top-bg {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 400rpx;
		background-color: var(--bg-header);
		border-radius: 0 0 120rpx 120rpx;
	}

	.content-wrapper {
		position: relative;
		padding: 60rpx 40rpx;
		z-index: 10;
	}

	.page-title {
		font-size: 48rpx;
		font-weight: 800;
		color: var(--text-main);
		margin-bottom: 8rpx;
	}

	.page-subtitle {
		font-size: 26rpx;
		color: var(--text-muted);
		margin-bottom: 60rpx;
	}

	.form-card {
		background-color: #FFF;
		border-radius: var(--radius-lg);
		padding: 40rpx;
		box-shadow: var(--shadow-soft);
	}

	.avatar-section {
		display: flex;
		justify-content: center;
		margin-top: -100rpx;
		margin-bottom: 40rpx;
	}

	.avatar-wrapper {
		width: 180rpx;
		height: 180rpx;
		background-color: #FFF;
		border-radius: var(--radius-full);
		padding: 10rpx;
		box-shadow: var(--shadow-soft);
		position: relative;
	}

	.avatar-image {
		width: 100%;
		height: 100%;
		border-radius: var(--radius-full);
	}

	.avatar-placeholder {
		width: 100%;
		height: 100%;
		border-radius: var(--radius-full);
		background-color: var(--bg-main);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.placeholder-icon { font-size: 60rpx; }
	.placeholder-text { font-size: 20rpx; color: var(--text-muted); }

	.camera-badge {
		position: absolute;
		bottom: 0;
		right: 0;
		width: 60rpx;
		height: 60rpx;
		background-color: var(--primary);
		border-radius: var(--radius-full);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 28rpx;
		border: 4rpx solid #FFF;
	}

	.form-body {
		padding-top: 20rpx;
	}

	.input-group {
		margin-bottom: 32rpx;
	}

	.field-label {
		font-size: 28rpx;
		font-weight: 700;
		color: var(--text-main);
		margin-bottom: 16rpx;
		display: block;
	}

	.pill-input {
		height: 100rpx;
		background-color: var(--bg-main);
		border-radius: var(--radius-full);
		padding: 0 40rpx;
		font-size: 28rpx;
		color: var(--text-main);
	}

	.placeholder-style { color: var(--text-muted); opacity: 0.6; }

	.type-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 16rpx;
	}

	.type-tag {
		padding: 20rpx 40rpx;
		background-color: var(--bg-main);
		border-radius: var(--radius-full);
		transition: all 0.3s;
	}

	.type-tag.active {
		background-color: var(--secondary);
		color: #FFF;
	}

	.type-text { font-size: 26rpx; font-weight: 600; }

	.input-row {
		display: flex;
		gap: 24rpx;
	}

	.half { flex: 1; }

	.gender-pill {
		display: flex;
		height: 100rpx;
		background-color: var(--bg-main);
		border-radius: var(--radius-full);
		padding: 8rpx;
	}

	.gender-btn {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 32rpx;
		color: var(--text-muted);
		border-radius: var(--radius-full);
	}

	.gender-btn.active {
		background-color: #FFF;
		color: var(--secondary);
		font-weight: 800;
		box-shadow: var(--shadow-soft);
	}

	.picker-view {
		display: flex;
		align-items: center;
		color: var(--text-muted);
	}

	.picker-view.hasValue { color: var(--text-main); }

	.action-area {
		margin-top: 60rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.main-cta-btn {
		width: 100%;
		height: 110rpx;
		background-color: var(--primary);
		color: var(--text-main);
		border-radius: var(--radius-full);
		font-size: 32rpx;
		font-weight: 800;
		box-shadow: 0 10rpx 20rpx rgba(255, 182, 41, 0.3);
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		margin-bottom: 32rpx;
	}

	.cancel-btn {
		font-size: 26rpx;
		color: var(--text-muted);
		text-decoration: underline;
	}
</style>
