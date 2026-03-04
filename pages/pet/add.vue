<template>
	<view class="container">
		<view class="form-card">
			<!-- 头像选择 -->
			<view class="avatar-section">
				<view class="avatar-label">宠物头像</view>
				<view class="avatar-wrapper" @tap="chooseAvatar">
					<image v-if="avatar" :src="avatar" mode="aspectFill" class="avatar-image"></image>
					<view v-else class="avatar-placeholder">
						<text class="placeholder-icon">🐾</text>
						<text class="placeholder-text">点击上传头像</text>
					</view>
				</view>
			</view>

			<!-- 基本信息 -->
			<view class="form-section">
				<view class="section-title">基本信息</view>

				<view class="form-item">
					<view class="label">宠物名字 <text class="required">*</text></view>
					<input class="input" v-model="pet.name" placeholder="请输入宠物名字" placeholder-class="placeholder" />
				</view>

				<view class="form-item">
					<view class="label">宠物类型 <text class="required">*</text></view>
					<picker :range="petTypes" :value="petTypeIndex" @change="onPetTypeChange" class="picker">
						<view class="picker-input" :class="{placeholder: petTypeIndex === -1}">
							{{petTypeIndex > -1 ? petTypes[petTypeIndex] : '请选择宠物类型'}}
						</view>
					</picker>
				</view>

				<view class="form-item">
					<view class="label">品种</view>
					<input class="input" v-model="pet.breed" placeholder="例如：金毛、英短等" placeholder-class="placeholder" />
				</view>

				<view class="form-item">
					<view class="label">性别</view>
					<view class="gender-group">
						<view class="gender-item" :class="{active: pet.gender === 'male'}" @tap="pet.gender = 'male'">
							<text class="gender-icon">♂</text>
							<text class="gender-text">公</text>
						</view>
						<view class="gender-item" :class="{active: pet.gender === 'female'}" @tap="pet.gender = 'female'">
							<text class="gender-icon">♀</text>
							<text class="gender-text">母</text>
						</view>
					</view>
				</view>

				<view class="form-item">
					<view class="label">生日</view>
					<picker mode="date" :value="pet.birthday" @change="onBirthdayChange" class="picker">
						<view class="picker-input" :class="{placeholder: !pet.birthday}">
							{{pet.birthday || '请选择生日'}}
						</view>
					</picker>
				</view>

				<view class="form-item">
					<view class="label">体重（kg）</view>
					<input class="input" v-model="pet.weight" type="digit" placeholder="请输入体重" placeholder-class="placeholder" />
				</view>
			</view>

			<!-- 提交按钮 -->
			<view class="submit-section">
				<button class="submit-btn" @tap="savePet">保存宠物</button>
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
				pet: {
					name: '',
					type: '',
					breed: '',
					gender: '',
					birthday: '',
					weight: '',
					avatar: ''
				},
				petTypes: ['狗狗', '猫咪', '鸟类', '其他'],
				petTypeIndex: -1,
				avatar: ''
			}
		},
		methods: {
			onPetTypeChange(e) {
				this.petTypeIndex = e.detail.value;
				this.pet.type = this.petTypes[e.detail.value];
			},

			onBirthdayChange(e) {
				this.pet.birthday = e.detail.value;
			},

			chooseAvatar() {
				uni.chooseImage({
					count: 1,
					sizeType: ['compressed'],
					sourceType: ['album', 'camera'],
					success: (res) => {
						this.avatar = res.tempFilePaths[0];
						this.pet.avatar = res.tempFilePaths[0];
					}
				});
			},

			async savePet() {
				// 表单验证
				if (!this.pet.name.trim()) {
					uni.showToast({ title: '请输入宠物名字', icon: 'none' });
					return;
				}

				if (!this.pet.type) {
					uni.showToast({ title: '请选择宠物类型', icon: 'none' });
					return;
				}

				try {
					uni.showLoading({ title: '保存中...' });
					const userId = await getUserId();
					const avatar = await this.uploadAvatar(this.avatar);

					await createPet({
						userId,
						name: this.pet.name.trim(),
						type: this.pet.type,
						breed: this.pet.breed.trim(),
						gender: this.pet.gender,
						birthday: this.pet.birthday,
						weight: this.pet.weight,
						avatar
					});

					uni.hideLoading();
					uni.showToast({
						title: '保存成功',
						icon: 'success',
						success: () => {
							setTimeout(() => {
								uni.navigateBack();
							}, 1500);
						}
					});
				} catch (error) {
					uni.hideLoading();
					uni.showToast({ title: error.message || '保存失败', icon: 'none' });
				}
			},

			async uploadAvatar(avatarPath) {
				if (!avatarPath) return '';
				if (/^https?:\/\//.test(avatarPath)) return avatarPath;
				const result = await uploadImage(avatarPath);
				if (result.url) return `${BASE_URL}${result.url}`;
				return result.path || avatarPath;
			}
		}
	}
</script>

<style>
	.container {
		min-height: 100vh;
		background-color: #f8f9fa;
		padding: 30rpx;
	}

	.form-card {
		background-color: #fff;
		border-radius: 32rpx;
		padding: 40rpx;
		box-shadow: 0 8rpx 30rpx rgba(0,0,0,0.05);
	}

	/* 头像部分 */
	.avatar-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-bottom: 48rpx;
	}

	.avatar-label {
		font-size: 28rpx;
		font-weight: 600;
		color: #333;
		margin-bottom: 24rpx;
	}

	.avatar-wrapper {
		width: 200rpx;
		height: 200rpx;
		border-radius: 50%;
		overflow: hidden;
		border: 6rpx solid #ffb347;
		position: relative;
	}

	.avatar-image {
		width: 100%;
		height: 100%;
	}

	.avatar-placeholder {
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, #ffe0b2, #ffcc80);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.placeholder-icon {
		font-size: 80rpx;
		margin-bottom: 8rpx;
	}

	.placeholder-text {
		font-size: 24rpx;
		color: #ff9800;
	}

	/* 表单部分 */
	.form-section {
		margin-bottom: 40rpx;
	}

	.section-title {
		font-size: 32rpx;
		font-weight: 700;
		color: #333;
		margin-bottom: 32rpx;
		padding-left: 16rpx;
		border-left: 6rpx solid #ffb347;
	}

	.form-item {
		margin-bottom: 32rpx;
	}

	.label {
		font-size: 28rpx;
		font-weight: 600;
		color: #444;
		margin-bottom: 16rpx;
	}

	.required {
		color: #ff6b6b;
		margin-left: 4rpx;
	}

	.input, .picker-input {
		background-color: #f5f6f7;
		padding: 24rpx 28rpx;
		border-radius: 20rpx;
		font-size: 28rpx;
		color: #333;
		border: 2rpx solid transparent;
		transition: all 0.3s;
		box-sizing: border-box;
	}

	.input {
		height: 88rpx;
		line-height: 88rpx;
		padding: 0 28rpx;
	}

	.input:focus {
		border-color: #ffb347;
		background-color: #fff;
	}

	.picker {
		width: 100%;
	}

	.picker-input {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.picker-input.placeholder {
		color: #7a7a7a;
	}

	.placeholder {
		color: #7a7a7a;
	}

	/* 性别选择 */
	.gender-group {
		display: flex;
		gap: 24rpx;
	}

	.gender-item {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #f5f6f7;
		padding: 24rpx;
		border-radius: 20rpx;
		transition: all 0.3s;
	}

	.gender-item.active {
		background: linear-gradient(135deg, #ffb347, #ff8c42);
		color: #fff;
	}

	.gender-icon {
		font-size: 36rpx;
		margin-right: 8rpx;
	}

	.gender-text {
		font-size: 28rpx;
		font-weight: 600;
	}

	/* 提交按钮 */
	.submit-section {
		margin-top: 40rpx;
	}

	.submit-btn {
		background: linear-gradient(135deg, #ffb347, #ff8c42);
		color: #fff;
		font-weight: bold;
		border-radius: 50rpx;
		font-size: 32rpx;
		border: none;
		box-shadow: 0 10rpx 25rpx rgba(255, 140, 66, 0.3);
	}

	.submit-btn:active {
		opacity: 0.9;
		transform: scale(0.98);
	}
</style>
