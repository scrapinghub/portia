# vim:ft=ruby

Vagrant.configure("2") do |config|
 	config.vm.box_url = 'http://files.vagrantup.com/precise32.box'
	config.vm.box = "precise32"
	config.vm.host_name = "portia"
	config.vm.provision :shell, :path => 'provision.sh'
	config.vm.network "private_network", ip: "33.33.33.10"
	config.vm.network "forwarded_port", guest: 8000, host: 8000
	config.vm.provider "virtualbox" do |v|
		v.memory = 512
 		v.cpus = 1
	end
end

